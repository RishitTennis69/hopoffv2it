const {
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');
const { APP_PACKAGES } = require('./catalogPackages');

/** Adds Usage Access permission + package visibility queries for the HopOff catalog. */
function withHopOffAndroid(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest['uses-permission'] = manifest['uses-permission'] ?? [];
    const perms = [
      'android.permission.PACKAGE_USAGE_STATS',
      'android.permission.FOREGROUND_SERVICE',
    ];
    for (const name of perms) {
      if (!manifest['uses-permission'].some((p) => p.$['android:name'] === name)) {
        manifest['uses-permission'].push({
          $: {
            'android:name': name,
            'tools:ignore': 'ProtectedPermissions',
          },
        });
      }
    }

    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Android 11+ package visibility — lets us detect catalog apps on the device.
    if (!manifest.queries) manifest.queries = [{}];
    const q = manifest.queries[0];
    q.package = q.package ?? [];
    for (const pkg of APP_PACKAGES) {
      if (!q.package.some((p) => p.$['android:name'] === pkg)) {
        q.package.push({ $: { 'android:name': pkg } });
      }
    }

    return cfg;
  });
}

module.exports = withHopOffAndroid;
