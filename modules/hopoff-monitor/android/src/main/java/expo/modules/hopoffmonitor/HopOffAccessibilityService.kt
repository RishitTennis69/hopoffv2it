package expo.modules.hopoffmonitor

import android.accessibilityservice.AccessibilityService
import android.app.usage.UsageStatsManager
import android.content.Intent
import android.net.Uri
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * Watches the foreground app. When a tracked package exceeds its daily limit,
 * launches hopoff://block?appId=<id>.
 *
 * For [blockMode] limits (Shorts / Reels), time is tracked only while the user
 * is inside that feed — the rest of the parent app stays usable.
 */
class HopOffAccessibilityService : AccessibilityService() {

  private var lastBlockAt = 0L
  private var lastPackage: String? = null
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
      }
      checkFullAppLimits(pkg, fullLimits)
    }

    if (featureLimits.isNotEmpty() &&
      (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
        event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED)
    ) {
      checkFeatureLimits(pkg, featureLimits)
    }
  }

  override fun onInterrupt() {
    flushFeatureSession()
  }

  private fun checkFullAppLimits(pkg: String, limits: List<AppLimit>) {
    val match = limits.firstOrNull { it.packageId == pkg } ?: return
    val usedMinutes = todayUsageMinutes(pkg)
    if (usedMinutes < match.limitMinutes) return
    triggerBlock(match.appId)
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
          val used = getFeatureUsageMinutes(limit.appId) + currentSessionMinutes()
          if (used >= limit.limitMinutes) {
            flushFeatureSession()
            triggerBlock(limit.appId)
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

  private fun triggerBlock(appId: String) {
    val now = System.currentTimeMillis()
    if (now - lastBlockAt < 30_000) return
    lastBlockAt = now

    val uri = Uri.parse("hopoff://block?appId=$appId")
    val intent = Intent(Intent.ACTION_VIEW, uri).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    startActivity(intent)
  }

  private fun isInYoutubeShorts(root: AccessibilityNodeInfo): Boolean {
    return nodeMatches(root) { node ->
      val text = node.text?.toString()?.lowercase()?.trim() ?: ""
      val desc = node.contentDescription?.toString()?.lowercase()?.trim() ?: ""
      (text == "shorts" || desc == "shorts") && node.isSelected
    }
  }

  private fun isInInstagramReels(root: AccessibilityNodeInfo): Boolean {
    return nodeMatches(root) { node ->
      val text = node.text?.toString()?.lowercase()?.trim() ?: ""
      val desc = node.contentDescription?.toString()?.lowercase()?.trim() ?: ""
      (text == "reels" || desc == "reels") && node.isSelected
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
    val blockMode: String? = null,
  )

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
              blockMode = obj.optString("blockMode").takeIf { it.isNotBlank() },
            ),
          )
        }
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun todayUsageMinutes(packageName: String): Int {
    val usm = getSystemService(USAGE_STATS_SERVICE) as? UsageStatsManager ?: return 0
    val cal = Calendar.getInstance()
    cal.set(Calendar.HOUR_OF_DAY, 0)
    cal.set(Calendar.MINUTE, 0)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    val start = cal.timeInMillis
    val end = System.currentTimeMillis()
    val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end) ?: return 0
    val totalMs = stats
      .filter { it.packageName == packageName }
      .sumOf { it.totalTimeInForeground }
    return (totalMs / 60_000).toInt()
  }

  private fun featureUsageKey(appId: String): String {
    val cal = Calendar.getInstance()
    val day = "${cal.get(Calendar.YEAR)}-${cal.get(Calendar.DAY_OF_YEAR)}"
    return "feature_usage_${appId}_$day"
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
