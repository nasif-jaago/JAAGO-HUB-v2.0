import { describe, it, expect } from "vitest";
import { SecretManager, type SecretProvider } from "../src/secrets/secret-manager.js";

describe("SecretManager", () => {
  const mockProvider: SecretProvider = {
    get: (key: string) => {
      if (key === "EXISTING_KEY") return "existing_value";
      return undefined;
    },
  };

  const manager = new SecretManager([mockProvider]);

  it("retrieves existing secret", async () => {
    const val = await manager.get("EXISTING_KEY");
    expect(val).toBe("existing_value");
  });

  it("returns undefined for missing secret", async () => {
    const val = await manager.get("NON_EXISTENT_KEY");
    expect(val).toBeUndefined();
  });

  it("throws when require() is called for a missing secret", async () => {
    await expect(manager.require("MISSING_KEY")).rejects.toThrow(/MISSING_KEY/);
  });
});
