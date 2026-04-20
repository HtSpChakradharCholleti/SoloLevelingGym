module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // React Compiler — auto-memoizes components & hooks at compile time.
      // Requires React 19 (no runtime shim needed). Components that violate
      // the Rules of React are safely skipped without breaking anything.
      ['babel-plugin-react-compiler', { target: '19' }],
    ],
  };
};
