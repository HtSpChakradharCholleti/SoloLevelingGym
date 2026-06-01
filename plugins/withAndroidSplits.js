const { withAppBuildGradle } = require('@expo/config-plugins');

/** @param {import('@expo/config-plugins').ExpoConfig} config */
const withAndroidSplits = (config) => {
  // Step 1: Inject splits configuration in android/app/build.gradle
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    
    if (!contents.includes('splits {')) {
      const splitsBlock = `
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false
        }
    }`;
      
      contents = contents.replace(/android\s*\{/, `android {\n${splitsBlock}`);
      config.modResults.contents = contents;
      console.log('[withAndroidSplits] Injected splits block inside android { ... } block in build.gradle');
    }
    
    return config;
  });
};

module.exports = withAndroidSplits;
