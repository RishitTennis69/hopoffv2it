package expo.modules.hopoffmonitor

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import kotlin.math.min

class HopOffMonitorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HopOffMonitor")

    AsyncFunction("openAccessibilitySettings") {
      val ctx = appContext.reactContext
      if (ctx != null) {
        val service = ComponentName(ctx, HopOffAccessibilityService::class.java)
        var launched = false

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          try {
            // Raw action string avoids needing the API 31+ Settings constant at compile time.
            val intent =
              Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS").apply {
                putExtra(Intent.EXTRA_COMPONENT_NAME, service.flattenToString())
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              }
            ctx.startActivity(intent)
            launched = true
          } catch (_: Exception) {
            // Fall through to generic settings.
          }
        }

        if (!launched) {
          val intent =
            Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
          ctx.startActivity(intent)
        }
      }
    }

    AsyncFunction("openUsageAccessSettings") {
      val ctx = appContext.reactContext
      if (ctx != null) {
        val pkg = ctx.packageName
        val targeted =
          Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            data = Uri.parse("package:$pkg")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        val generic =
          Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }

        var launched = false
        for (intent in listOf(targeted, generic)) {
          if (!launched) {
            try {
              ctx.startActivity(intent)
              launched = true
            } catch (_: Exception) {
              // Try next intent shape.
            }
          }
        }
      }
    }

    AsyncFunction("isAccessibilityEnabled") {
      isAccessibilityServiceEnabled(appContext.reactContext)
    }

    AsyncFunction("syncGroups") { json: String ->
      val prefs = appContext.reactContext?.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      prefs?.edit()?.putString(KEY_GROUPS, json)?.apply()
    }

    AsyncFunction("getInstalledPackages") { packageIds: List<String> ->
      val pm = appContext.reactContext?.packageManager ?: return@AsyncFunction emptyList<String>()
      packageIds.filter { pkg ->
        try {
          @Suppress("DEPRECATION")
          pm.getPackageInfo(pkg, 0)
          true
        } catch (_: Exception) {
          false
        }
      }
    }

    AsyncFunction("hasUsageAccess") {
      hasUsageAccess(appContext.reactContext)
    }

    /** Return user to a limited app after they dismiss the block screen. */
    AsyncFunction("launchPackage") { packageId: String ->
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      val pm = ctx.packageManager
      val launch = pm.getLaunchIntentForPackage(packageId) ?: return@AsyncFunction false
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(launch)
      true
    }

    /** Per-package foreground minutes for the last N calendar days (UsageStatsManager). */
    AsyncFunction("getPackageUsageHistory") { packageNames: List<String>, days: Int ->
      val ctx = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any>>()
      if (!hasUsageAccess(ctx)) return@AsyncFunction emptyList<Map<String, Any>>()

      val usm =
        ctx.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
          ?: return@AsyncFunction emptyList<Map<String, Any>>()

      val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
      val safeDays = days.coerceIn(1, 30)
      val packageSet = packageNames.toSet()
      val dayTotals = linkedMapOf<String, MutableMap<String, Long>>()

      for (offset in (safeDays - 1) downTo 0) {
        val startCal = Calendar.getInstance()
        startCal.add(Calendar.DAY_OF_YEAR, -offset)
        startCal.set(Calendar.HOUR_OF_DAY, 0)
        startCal.set(Calendar.MINUTE, 0)
        startCal.set(Calendar.SECOND, 0)
        startCal.set(Calendar.MILLISECOND, 0)
        val start = startCal.timeInMillis

        val endCal = startCal.clone() as Calendar
        endCal.add(Calendar.DAY_OF_YEAR, 1)
        val end =
          if (offset == 0) {
            min(endCal.timeInMillis, System.currentTimeMillis())
          } else {
            endCal.timeInMillis
          }

        val dateStr = fmt.format(java.util.Date(start))
        val dayMap = dayTotals.getOrPut(dateStr) { mutableMapOf() }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          val aggregated = usm.queryAndAggregateUsageStats(start, end)
          for (pkg in packageNames) {
            val ms = aggregated[pkg]?.totalTimeInForeground ?: 0L
            if (ms > 0L) dayMap[pkg] = (dayMap[pkg] ?: 0L) + ms
          }
        } else {
          @Suppress("DEPRECATION")
          val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, start, end) ?: emptyList()
          for (pkg in packageNames) {
            val ms = stats.filter { it.packageName == pkg }.sumOf { it.totalTimeInForeground }
            if (ms > 0L) dayMap[pkg] = (dayMap[pkg] ?: 0L) + ms
          }
        }
      }

      val totalMs = dayTotals.values.sumOf { day -> day.values.sum() }
      if (totalMs == 0L && dayTotals.isNotEmpty()) {
        val rangeStartCal = Calendar.getInstance()
        rangeStartCal.add(Calendar.DAY_OF_YEAR, -(safeDays - 1))
        rangeStartCal.set(Calendar.HOUR_OF_DAY, 0)
        rangeStartCal.set(Calendar.MINUTE, 0)
        rangeStartCal.set(Calendar.SECOND, 0)
        rangeStartCal.set(Calendar.MILLISECOND, 0)
        aggregateUsageFromEvents(
          usm,
          rangeStartCal.timeInMillis,
          System.currentTimeMillis(),
          packageSet,
          fmt,
          dayTotals,
        )
      }

      val result = mutableListOf<Map<String, Any>>()
      for ((dateStr, pkgs) in dayTotals) {
        for (pkg in packageNames) {
          val ms = pkgs[pkg] ?: 0L
          result.add(
            mapOf(
              "date" to dateStr,
              "trackId" to pkg,
              "minutes" to (ms / 60_000).toInt(),
            ),
          )
        }
      }

      result
    }

    /** Feature-feed minutes (Shorts / Reels) keyed by yyyy-MM-dd → appId → minutes. */
    AsyncFunction("getFeatureUsageHistory") { appIds: List<String>, dateKeys: List<String> ->
      val ctx = appContext.reactContext ?: return@AsyncFunction emptyMap<String, Map<String, Int>>()
      val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
      val out = mutableMapOf<String, Map<String, Int>>()

      for (dateStr in dateKeys) {
        val parsed = try {
          fmt.parse(dateStr)
        } catch (_: Exception) {
          null
        } ?: continue

        val cal = Calendar.getInstance().apply { time = parsed }
        val year = cal.get(Calendar.YEAR)
        val dayOfYear = cal.get(Calendar.DAY_OF_YEAR)
        val dayMap = mutableMapOf<String, Int>()

        for (appId in appIds) {
          val key = "feature_usage_${appId}_${year}-${dayOfYear}"
          val ms = prefs.getLong(key, 0L)
          if (ms > 0L) {
            dayMap[appId] = (ms / 60_000).toInt()
          }
        }

        if (dayMap.isNotEmpty()) {
          out[dateStr] = dayMap
        }
      }

      out
    }
  }

  companion object {
    const val PREFS = "hopoff_monitor"
    const val KEY_GROUPS = "groups_json"

    fun hasUsageAccess(context: Context?): Boolean {
      if (context == null) return false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
      val mode =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          appOps.unsafeCheckOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName,
          )
        } else {
          @Suppress("DEPRECATION")
          appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName,
          )
        }
      return mode == AppOpsManager.MODE_ALLOWED
    }

    fun isAccessibilityServiceEnabled(context: Context?): Boolean {
      if (context == null) return false
      val enabled = Settings.Secure.getInt(
        context.contentResolver,
        Settings.Secure.ACCESSIBILITY_ENABLED,
        0,
      )
      if (enabled != 1) return false
      val services = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
      ) ?: return false
      val expected = "${context.packageName}/${HopOffAccessibilityService::class.java.name}"
      return services.split(':').any { it.equals(expected, ignoreCase = true) }
    }

    private fun aggregateUsageFromEvents(
      usm: UsageStatsManager,
      start: Long,
      end: Long,
      packages: Set<String>,
      fmt: SimpleDateFormat,
      dayTotals: MutableMap<String, MutableMap<String, Long>>,
    ) {
      val events = usm.queryEvents(start, end) ?: return
      val event = UsageEvents.Event()
      val sessions = mutableMapOf<String, Long>()

      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        val pkg = event.packageName
        if (pkg !in packages) continue

        when (event.eventType) {
          UsageEvents.Event.ACTIVITY_RESUMED,
          UsageEvents.Event.MOVE_TO_FOREGROUND,
          -> sessions[pkg] = event.timeStamp

          UsageEvents.Event.ACTIVITY_PAUSED,
          UsageEvents.Event.MOVE_TO_BACKGROUND,
          -> {
            val sessionStart = sessions.remove(pkg) ?: continue
            val duration = (event.timeStamp - sessionStart).coerceAtLeast(0L)
            if (duration <= 0L) continue
            val dateStr = fmt.format(java.util.Date(event.timeStamp))
            val dayMap = dayTotals.getOrPut(dateStr) { mutableMapOf() }
            dayMap[pkg] = (dayMap[pkg] ?: 0L) + duration
          }
        }
      }
    }
  }
}
