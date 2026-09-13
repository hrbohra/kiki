module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // reanimated worklets transform — must be last.
    plugins: ['react-native-reanimated/plugin'],
  };
};
