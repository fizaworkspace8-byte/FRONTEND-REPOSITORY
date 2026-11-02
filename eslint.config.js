import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {},
    rules: {
      ...js.configs.recommended.rules,
      // Undefined identifiers are exactly the runtime crash class we keep
      // hitting (Badge/columnDefs is not defined). Keep these as errors.
      'no-undef': 'error',
      // JSX-heavy code trips false "unused" reports without the React plugin;
      // keep as warnings so real errors stand out.
      'no-unused-vars': 'warn',
    },
  },
];