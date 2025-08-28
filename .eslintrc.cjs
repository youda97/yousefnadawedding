/* eslint-env node */
export default {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint','react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['dist','node_modules'],
  rules: {
    'react-refresh/only-export-components': 'warn'
  }
}