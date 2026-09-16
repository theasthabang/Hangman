import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
      // This project doesn't use babel-plugin-react-compiler (check
      // package.json — it's not a dependency), so React Compiler never
      // actually runs in this build. This rule only warns about
      // hypothetical Compiler optimization conflicts, which have zero
      // effect on a project that isn't compiling with it. Safe to
      // disable rather than chase compiler-specific dependency-array
      // shapes for a compiler that isn't in the pipeline.
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
])