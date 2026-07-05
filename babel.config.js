module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Expo Go's Hermes build cannot parse native `#private` syntax.
          // hermes-stable leaves private fields untransformed; `default` forces
          // Babel to lower them so the bundle runs on all Hermes versions.
          unstable_transformProfile: 'default',
        },
      ],
    ],
    plugins: [
      // react-native-reanimated/plugin MUST be last in the plugins array.
      'react-native-reanimated/plugin',
    ],
  };
};


