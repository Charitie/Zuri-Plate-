// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['node_modules/*', '.expo/*', '.kilo/*', 'dist/*'],
  },
  {
    rules: {
      // Stale-closure bugs are the most common hooks mistake; fail the build on them.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
