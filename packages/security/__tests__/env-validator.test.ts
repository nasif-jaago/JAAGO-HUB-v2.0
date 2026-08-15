import { describe, it, expect } from "vitest";
import { validateEnv, baseEnvSchema } from "../src/env/env-validator.js";

describe("validateEnv", () => {
  const validEnv = {
    NODE_ENV: "development",
    PORT: "3001",
    DATABASE_URL: "postgresql://postgres:pass@localhost:5432/postgres",
    SUPABASE_URL: "https://rdmyghbciiepqmlwekjd.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
    REDIS_URL: "redis://localhost:6379",
    ENCRYPTION_KEK: "very_secure_kek_key_at_least_32_characters_long",
  };

  it("passes validation with all required variables present", () => {
    const result = validateEnv(baseEnvSchema, validEnv);
    expect(result.PORT).toBe(3001);
    expect(result.NODE_ENV).toBe("development");
    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it("throws and blocks startup when DATABASE_URL is missing", () => {
    const invalidEnv = { ...validEnv, DATABASE_URL: "" };
    expect(() => validateEnv(baseEnvSchema, invalidEnv)).toThrow(/DATABASE_URL/);
  });

  it("throws and blocks startup when SUPABASE_URL is invalid", () => {
    const invalidEnv = { ...validEnv, SUPABASE_URL: "not-a-url" };
    expect(() => validateEnv(baseEnvSchema, invalidEnv)).toThrow(/SUPABASE_URL/);
  });

  it("throws and blocks startup when ENCRYPTION_KEK is too short", () => {
    const invalidEnv = { ...validEnv, ENCRYPTION_KEK: "short" };
    expect(() => validateEnv(baseEnvSchema, invalidEnv)).toThrow(/ENCRYPTION_KEK/);
  });
});
