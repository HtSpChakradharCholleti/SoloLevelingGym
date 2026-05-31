/**
 * withNetworkSecurityConfig.js
 *
 * Expo config plugin that persists the Android network security config across
 * `expo prebuild --clean` runs. Without this, the XML file and AndroidManifest
 * attribute must be manually restored after every clean prebuild.
 *
 * What it does:
 *  1. Copies `network_security_config.xml` from the project root into
 *     `android/app/src/main/res/xml/` on every prebuild.
 *  2. Adds `android:networkSecurityConfig="@xml/network_security_config"` to
 *     the <application> tag in AndroidManifest.xml.
 *
 * The source file (`network_security_config.xml` at project root) is the
 * canonical version — edit it there, not inside the android/ directory.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/** @param {import('@expo/config-plugins').ExpoConfig} config */
const withNetworkSecurityConfig = (config) => {
  // Step 1: Copy the XML file into the Android res/xml directory
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml'
      );
      const src = path.join(config.modRequest.projectRoot, 'network_security_config.xml');
      const dest = path.join(xmlDir, 'network_security_config.xml');

      if (!fs.existsSync(src)) {
        throw new Error(
          `[withNetworkSecurityConfig] Source file not found: ${src}\n` +
          'Create network_security_config.xml at the project root.'
        );
      }

      fs.mkdirSync(xmlDir, { recursive: true });
      fs.copyFileSync(src, dest);
      console.log('[withNetworkSecurityConfig] Copied network_security_config.xml → android/app/src/main/res/xml/');

      return config;
    },
  ]);

  // Step 2: Add the networkSecurityConfig attribute to <application> in AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) {
      throw new Error('[withNetworkSecurityConfig] Could not find <application> in AndroidManifest.xml');
    }

    if (!application.$) application.$ = {};
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    console.log('[withNetworkSecurityConfig] Set android:networkSecurityConfig on <application>');
    return config;
  });

  return config;
};

module.exports = withNetworkSecurityConfig;
