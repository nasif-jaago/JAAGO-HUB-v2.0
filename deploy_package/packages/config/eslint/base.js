import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/*.js.map",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // TypeScript strict rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "off", // off in base; on in specific configs

      // No magic strings for status values — use enums/constants
      "no-magic-numbers": "off", // Too noisy; handled by code review

      // Import discipline
      "import/no-duplicates": "error",
      "import/no-cycle": "error",  // Important: prevents circular deps
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Module boundary: prevent cross-module internal imports
              group: ["**/infrastructure/**", "**/domain/**"],
              importNames: ["*Repository*", "*Repo*"],
              message:
                "Do not import repositories from outside the owning module. Use the published application service interface.",
            },
          ],
        },
      ],

      // General quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
    },
  },
];
