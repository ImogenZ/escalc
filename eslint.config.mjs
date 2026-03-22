// @ts-check

import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ["./src/**/*.{test,bench}.ts"],
    plugins: {
      vitest,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    rules: vitest.configs.all.rules,
  },
  globalIgnores([
    ".rollup.cache",
    "dist",
    "docs-dist",
    "rollup.config.mjs",
    "eslint.config.mjs",
    "vitest.config.ts",
  ]),
);
