module.exports = function (api) {
  api.cache(false); // Disable cache so env changes are picked up
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: false,
          verbose: false,
        },
      ],
    ],
  };
};
