import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/**/*.{test,spec}.ts",
      "__tests__/**/*.{test,spec}.ts",
      "src/**/*.{test,spec}.ts",
    ],
    passWithNoTests: true,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@jaago/testing": path.resolve(__dirname, "packages/testing/src"),
      "@jaago/validation": path.resolve(__dirname, "packages/validation/src"),
      "@jaago/shared-types": path.resolve(__dirname, "packages/shared-types/src"),
      "@jaago/database": path.resolve(__dirname, "packages/database/src"),
      "@jaago/auth": path.resolve(__dirname, "packages/auth/src"),
      "@jaago/cache": path.resolve(__dirname, "packages/cache/src"),
      "@jaago/logger": path.resolve(__dirname, "packages/logger/src"),
      "@jaago/observability": path.resolve(__dirname, "packages/observability/src"),
      "@jaago/security": path.resolve(__dirname, "packages/security/src"),
      "@jaago/queue": path.resolve(__dirname, "packages/queue/src"),
      "@jaago/events": path.resolve(__dirname, "packages/events/src"),
      "@jaago/integrations": path.resolve(__dirname, "packages/integrations/src"),
    },
  },
});
