import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Untyped Django JSON API surface — typing every payload is out of scope.
      '@typescript-eslint/no-explicit-any': 'off',
      // New aggressive rule with known false positives on the standard
      // `useEffect(() => { fetchData() }, [deps])` data-fetch pattern used across all pages.
      'react-hooks/set-state-in-effect': 'off',
      // Standard shadcn/ui pattern: components export variants + context hooks.
      'react-refresh/only-export-components': 'off',
      // Fetch helpers are defined inline per page; keeping them in the dep array
      // would cause refetch loops without a full useCallback refactor.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
])
