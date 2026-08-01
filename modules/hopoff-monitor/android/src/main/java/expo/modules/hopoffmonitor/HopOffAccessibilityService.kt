package expo.modules.hopoffmonitor

import android.accessibilityservice.AccessibilityService
import android.app.usage.UsageStatsManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * Watches the foreground app. When a tracked package exceeds its daily limit,
 * launches hopoff://block?appId=<id>.
 */
class HopOffAccessibilityService : AccessibilityService() {

  private var lastBlockAt = 0L
  private var lastLimitCheckAt = 0L
  private var lastPackage: String? = null
  private var packageSessionStart = 0L
  private var packageSessionBlockedKey: String? = null
  private var featureSessionStart = 0L
  private var activeFeatureAppId: String? = null

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return

    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName) return

    val limits = loadLimits()
    if (limits.isEmpty()) return

    val featureLimits = limits.filter { it.blockMode != null }
    val fullLimits = limits.filter { it.blockMode == null }

    if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      if (pkg != lastPackage) {
        flushFeatureSession()
        lastPackage = pkg
        packageSessionStart = System.currentTimeMillis()
        packageSessionBlockedKey = null
      }
      checkFullLockIn(pkg, fullLimits)
      checkFullSessionLimits(pkg, fullLimits)
      checkFullAppLimits(pkg, fullLimits)
    }

    val isContentOrWindow =
      event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED ||
        event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED

    if (isContentOrWindow && fullLimits.any { it.packageId == pkg }) {
      maybeRecheckFullLimits(pkg, fullLimits)
    }

    if (featureLimits.isNotEmpty() && isContentOrWindow) {
      checkFeatureLimits(pkg, featureLimits)
    }
  }

  override fun onInterrupt() {
    flushFeatureSession()
  }

  /** Re-check while user stays in the same app (usage can cross limit without a new window event). */
  private fun maybeRecheckFullLimits(pkg: String, limits: List<AppLimit>) {
    val now = System.currentTimeMillis()
    if (now - lastLimitCheckAt < 4_000) return
    lastLimitCheckAt = now
    checkFullLockIn(pkg, limits)
    checkFullSessionLimits(pkg, limits)
    checkFullAppLimits(pkg, limits)
  }

  private fun checkFullLockIn(pkg: String, limits: List<AppLimit>) {
    val match = limits.firstOrNull { it.packageId == pkg && it.activeLockInLabel() != null } ?: return
    val label = match.activeLockInLabel()
    if (label == null || label == "lockin") {
      triggerBlock(match.appId, "lockin", ignoreSnooze = true, ignoreThrottle = true)
    } else {
      triggerBlock(match.appId, "schedule", ignoreSnooze = true, ignoreThrottle = true, scheduleLabel = label)
    }
  }

  private fun checkFullAppLimits(pkg: String, limits: List<AppLimit>) {
    val match = limits.firstOrNull { it.packageId == pkg } ?: return
    val usedMinutes = todayUsageMinutes(pkg)
    if (usedMinutes < match.limitMinutes) return
    triggerBlock(match.appId, "limit")
  }

  private fun checkFullSessionLimits(pkg: String, limits: List<AppLimit>) {
    val match = limits.firstOrNull { it.packageId == pkg && it.sessionLimitMinutes > 0 } ?: return
    if (match.sessionLimitMinutes >= match.limitMinutes) return
    val usedMinutes = todayUsageMinutes(pkg)
    if (usedMinutes >= match.limitMinutes) {
      triggerBlock(match.appId, "limit")
      return
    }
    val crossedSession = usedMinutes / match.sessionLimitMinutes
    if (crossedSession > 0) {
      val key = sessionBoundaryKey(match.appId)
      val prefs = getSharedPreferences(HopOffMonitorModule.PREFS, MODE_PRIVATE)
      val lastBlockedSession = prefs.getInt(key, 0)
      if (crossedSession > lastBlockedSession) {
        if (triggerBlock(match.appId, "session")) {
          prefs.edit().putInt(key, crossedSession).apply()
        }
        return
      }
    }
  }

  private fun checkFeatureLimits(pkg: String, limits: List<AppLimit>) {
    val relevant = limits.filter { it.packageId == pkg }
    if (relevant.isEmpty()) {
      if (activeFeatureAppId != null) flushFeatureSession()
      return
    }

    val root = rootInActiveWindow
    if (root == null) {
      if (activeFeatureAppId != null) flushFeatureSession()
      return
    }

    try {
      var anyActive = false
      for (limit in relevant) {
        val inFeature = when (limit.blockMode) {
          "shorts" -> isInYoutubeShorts(root)
          "reels" -> isInInstagramReels(root)
          else -> false
        }

          if (inFeature) {
            anyActive = true
            onFeatureEnter(limit.appId)
          val lockInLabel = limit.activeLockInLabel()
          if (lockInLabel != null) {
            flushFeatureSession()
            if (lockInLabel == "lockin") {
              triggerBlock(limit.appId, "lockin", ignoreSnooze = true, ignoreThrottle = true)
            } else {
              triggerBlock(limit.appId, "schedule", ignoreSnooze = true, ignoreThrottle = true, scheduleLabel = lockInLabel)
            }
            return
          }
          val used = getFeatureUsageMinutes(limit.appId) + currentSessionMinutes()
          if (used >= limit.limitMinutes) {
            flushFeatureSession()
            triggerBlock(limit.appId, "limit")
            return
          }
        }
      }

      if (!anyActive && activeFeatureAppId != null) {
        flushFeatureSession()
      }
    } finally {
      root.recycle()
    }
  }

  private fun onFeatureEnter(appId: String) {
    if (activeFeatureAppId == appId && featureSessionStart > 0) return
    flushFeatureSession()
    activeFeatureAppId = appId
    featureSessionStart = System.currentTimeMillis()
  }

  private fun flushFeatureSession() {
    val appId = activeFeatureAppId ?: return
    val start = featureSessionStart
    if (start <= 0) return
    val elapsedMs = System.currentTimeMillis() - start
    if (elapsedMs > 0) addFeatureUsage(appId, elapsedMs)
    activeFeatureAppId = null
    featureSessionStart = 0L
  }

  private fun currentSessionMinutes(): Int {
    val start = featureSessionStart
    if (start <= 0) return 0
    return ((System.currentTimeMillis() - start) / 60_000).toInt()
  }

  private fun triggerBlock(
    appId: String,
    reason: String,
    ignoreSnooze: Boolean = false,
    ignoreThrottle: Boolean = false,
    scheduleLabel: String? = null,
  ): Boolean {
    if (!ignoreSnooze && isSnoozed(appId)) return false
    val now = System.currentTimeMillis()
    if (!ignoreThrottle && now - lastBlockAt < 15_000) return false
    lastBlockAt = now

    val uri =
      Uri.Builder()
        .scheme("hopoff")
        .authority("block")
        .appendQueryParameter("appId", appId)
        .appendQueryParameter("reason", reason)
        .apply {
          if (!scheduleLabel.isNullOrBlank()) appendQueryParameter("scheduleLabel", scheduleLabel)
        }
        .appendQueryParameter("triggeredAt", now.toString())
        .build()
    val intent =
      Intent(Intent.ACTION_VIEW, uri).apply {
        setPackage(applicationContext.packageName)
        addCategory(Intent.CATEGORY_DEFAULT)
        addCategory(Intent.CATEGORY_BROWSABLE)
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP,
        )
      }
    startActivity(intent)
    return true
  }

  private fun isInYoutubeShorts(root: AccessibilityNodeInfo): Boolean {
    return nodeMatches(root) { node ->
      // YouTube names the Shorts player internally "reel" — the most reliable
      // signal, and it's present even in the immersive player where the bottom
      // nav (and its "Shorts" tab) is hidden. View ids require flagReportViewIds.
      val viewId = node.viewIdResourceName?.lowercase() ?: ""
      if (
        viewId.contains("shorts") ||
        viewId.contains("reel_player") ||
        viewId.contains("reel_watch") ||
        viewId.contains("reel_video")
      ) return@nodeMatches true

      val text = node.text?.toString()?.lowercase()?.trim() ?: ""
      val desc = node.contentDescription?.toString()?.lowercase()?.trim() ?: ""
      (text == "shorts" || desc == "shorts") && (node.isSelected || node.isFocused)
    }
  }

  private fun isInInstagramReels(root: AccessibilityNodeInfo): Boolean {
    return nodeMatches(root) { node ->
      // Instagram's Reels viewer uses "clips_viewer" / "reel" view ids — reliable
      // even when the Reels tab label isn't on screen.
      val viewId = node.viewIdResourceName?.lowercase() ?: ""
      if (
        viewId.contains("clips_viewer") ||
        viewId.contains("reels_viewer") ||
        viewId.contains("reel_viewer") ||
        viewId.contains("reel_player")
      ) return@nodeMatches true

      val text = node.text?.toString()?.lowercase()?.trim() ?: ""
      val desc = node.contentDescription?.toString()?.lowercase()?.trim() ?: ""
      (text == "reels" || desc == "reels") && (node.isSelected || node.isFocused)
    }
  }

  private fun nodeMatches(
    root: AccessibilityNodeInfo,
    predicate: (AccessibilityNodeInfo) -> Boolean,
  ): Boolean {
    val stack = ArrayDeque<AccessibilityNodeInfo>()
    stack.add(AccessibilityNodeInfo.obtain(root))
    while (stack.isNotEmpty()) {
      val node = stack.removeFirst()
      try {
        if (predicate(node)) return true
        for (i in 0 until node.childCount) {
          node.getChild(i)?.let { stack.add(it) }
        }
      } finally {
        node.recycle()
      }
    }
    return false
  }

  private data class AppLimit(
    val appId: String,
    val packageId: String,
    val limitMinutes: Int,
    val sessionLimitMinutes: Int = 0,
    val lockInUntil: Long = 0L,
    val lockInWindows: List<LockInWindow> = emptyList(),
    val blockMode: String? = null,
  ) {
    fun activeLockInLabel(): String? {
      val now = System.currentTimeMillis()
      if (lockInUntil > now) return "lockin"
      val cal = Calendar.getInstance()
      val minute = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
      return lockInWindows.firstOrNull { it.contains(minute) }?.label
    }
  }

  private data class LockInWindow(
    val startMinute: Int,
    val endMinute: Int,
    val id: String = "custom",
    val label: String = "scheduled",
  ) {
    fun contains(minute: Int): Boolean {
      return if (startMinute <= endMinute) {
        minute in startMinute until endMinute
      } else {
        minute >= startMinute || minute < endMinute
      }
    }
  }

  private fun isSnoozed(appId: String): Boolean {
    val prefs = getSharedPreferences(HopOffMonitorModule.PREFS, MODE_PRIVATE)
    val until = prefs.getLong("${HopOffMonitorModule.KEY_SNOOZE_PREFIX}$appId", 0L)
    return System.currentTimeMillis() < until
  }

  private fun loadLimits(): List<AppLimit> {
    val prefs = getSharedPreferences(HopOffMonitorModule.PREFS, MODE_PRIVATE)
    val raw = prefs.getString(HopOffMonitorModule.KEY_GROUPS, null) ?: return emptyList()
    return try {
      val arr = JSONArray(raw)
      buildList {
        for (i in 0 until arr.length()) {
          val obj = arr.getJSONObject(i)
          add(
            AppLimit(
              appId = obj.getString("appId"),
              packageId = obj.getString("packageId"),
              limitMinutes = obj.getInt("limitMinutes"),
              sessionLimitMinutes = obj.optInt("sessionLimitMinutes", 0),
              lockInUntil = obj.optLong("lockInUntil", 0L),
              lockInWindows = parseLockInWindows(obj),
              blockMode = obj.optString("blockMode").takeIf { it.isNotBlank() },
            ),
          )
        }
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun parseLockInWindows(obj: JSONObject): List<LockInWindow> {
    val arr = obj.optJSONArray("lockInWindows") ?: return emptyList()
    return buildList {
      for (i in 0 until arr.length()) {
        val win = arr.optJSONObject(i) ?: continue
        val start = win.optInt("startMinute", -1)
        val end = win.optInt("endMinute", -1)
        val id = win.optString("id", "custom")
        val label = win.optString("label", "scheduled")
        if (start in 0..1439 && end in 1..1440) {
          add(LockInWindow(start, end, id, label))
        }
      }
    }
  }

  private fun todayUsageMinutes(packageName: String): Int {
    if (!HopOffMonitorModule.hasUsageAccess(this)) return 0

    val usm = getSystemService(USAGE_STATS_SERVICE) as? UsageStatsManager ?: return 0
    val cal = Calendar.getInstance()
    cal.set(Calendar.HOUR_OF_DAY, 0)
    cal.set(Calendar.MINUTE, 0)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    val start = cal.timeInMillis
    val end = System.currentTimeMillis()

    val totalMs =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        usm.queryAndAggregateUsageStats(start, end)[packageName]?.totalTimeInForeground ?: 0L
      } else {
        @Suppress("DEPRECATION")
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, start, end) ?: return 0
        stats.filter { it.packageName == packageName }.sumOf { it.totalTimeInForeground }
      }

    return (totalMs / 60_000).toInt()
  }

  private fun featureUsageKey(appId: String): String {
    val cal = Calendar.getInstance()
    val day = "${cal.get(Calendar.YEAR)}-${cal.get(Calendar.DAY_OF_YEAR)}"
    return "feature_usage_${appId}_$day"
  }

  private fun sessionBoundaryKey(appId: String): String {
    val cal = Calendar.getInstance()
    val day = "${cal.get(Calendar.YEAR)}-${cal.get(Calendar.DAY_OF_YEAR)}"
    return "session_boundary_${appId}_$day"
  }

  private fun getFeatureUsageMinutes(appId: String): Int {
    val prefs = getSharedPreferences(HopOffMonitorModule.PREFS, MODE_PRIVATE)
    val ms = prefs.getLong(featureUsageKey(appId), 0L)
    return (ms / 60_000).toInt()
  }

  private fun addFeatureUsage(appId: String, elapsedMs: Long) {
    val prefs = getSharedPreferences(HopOffMonitorModule.PREFS, MODE_PRIVATE)
    val key = featureUsageKey(appId)
    val next = prefs.getLong(key, 0L) + elapsedMs
    prefs.edit().putLong(key, next).apply()
  }
}
