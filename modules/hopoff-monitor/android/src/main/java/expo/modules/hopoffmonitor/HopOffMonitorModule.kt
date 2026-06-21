package expo.modules.hopoffmonitor

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HopOffMonitorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HopOffMonitor")

    AsyncFunction("openAccessibilitySettings") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      appContext.reactContext?.startActivity(intent)
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
  }

  companion object {
    const val PREFS = "hopoff_monitor"
    const val KEY_GROUPS = "groups_json"

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
  }
}
