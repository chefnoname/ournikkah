// ESLint flat config (ESLint 9+)
// Extends Expo's curated rule set which covers:
//   - core JS rules
//   - @typescript-eslint/* rules
//   - React & React Hooks rules
//   - expo-specific rules
//
// ──────────────────────────────────────────────────────────────────────────────
// HOW TO CUSTOMISE RULES
// ──────────────────────────────────────────────────────────────────────────────
// Every rule accepts one of these severities:
//   'off'   – disable the rule entirely
//   'warn'  – highlight the violation but do NOT block commits/builds
//   'error' – block commits/builds (via pre-commit hook) and fail CI
//
// To override a rule from the base config, add it to the `rules` object below.
// Example: turn a warning into an error
//   '@typescript-eslint/no-unused-vars': 'error'
//
// Example: silence a rule you disagree with
//   'no-console': 'off'
//
// Example: configure a rule with options
//   '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used' }]
//
// Full rule references:
//   TypeScript rules  → https://typescript-eslint.io/rules/
//   React rules       → https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
//   React Hooks rules → https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
//   Core JS rules     → https://eslint.org/docs/latest/rules/
// ──────────────────────────────────────────────────────────────────────────────

const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  // ── Base: Expo's curated rules (TypeScript + React + Hooks + Expo-specific) ─
  ...expoConfig,

  // ── Project-level overrides ───────────────────────────────────────────────
  {
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────────
      // Unused variables are errors — they indicate incomplete logic or dead code.
      // Change to 'warn' if you only want highlighting without blocking commits.
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
        caughtErrors: 'all',
      }],

      'react/no-unescaped-entities': 'off',
      // Using `any` defeats the purpose of TypeScript — warn instead of silently allowing it.
      // Change to 'error' for stricter enforcement, or 'off' to permit any freely.
      '@typescript-eslint/no-explicit-any': 'warn',

      // require() imports are discouraged in Expo projects (use ES import syntax).
      // The base config already warns — this keeps it at warn level.
      '@typescript-eslint/no-require-imports': 'warn',

      // ── React ───────────────────────────────────────────────────────────────
      // Exhaustive deps: warn when useEffect/useCallback/useMemo deps are missing.
      // Change to 'error' to block commits on missing deps (recommended).
      'react-hooks/exhaustive-deps': 'warn',

      // ── General code quality ────────────────────────────────────────────────
      // console.log left in code is usually accidental. Warn to catch them.
      // Change to 'off' if you rely on console logging in development.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Ignored paths ─────────────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'build/',
      'expo-env.d.ts',
    ],
  },
];
