/**
 * SecretManager Abstraction
 *
 * Centralizes secret retrieval so business code never directly accesses `process.env`.
 * Supports dynamic providers (AWS SSM, HashiCorp Vault, Supabase Vault, etc.).
 */

export interface SecretProvider {
  get(key: string): Promise<string | undefined> | string | undefined;
}

export class EnvSecretProvider implements SecretProvider {
  get(key: string): string | undefined {
    return process.env[key];
  }
}

export class SecretManager {
  private readonly providers: SecretProvider[];

  constructor(providers: SecretProvider[] = [new EnvSecretProvider()]) {
    this.providers = providers;
  }

  /**
   * Retrieve a secret by key from the registered providers in priority order.
   */
  async get(key: string): Promise<string | undefined> {
    for (const provider of this.providers) {
      const val = await provider.get(key);
      if (val !== undefined && val !== "") {
        return val;
      }
    }
    return undefined;
  }

  /**
   * Retrieve a mandatory secret or throw an error.
   */
  async require(key: string): Promise<string> {
    const val = await this.get(key);
    if (!val) {
      throw new Error(`Required secret "${key}" is not configured in any SecretProvider`);
    }
    return val;
  }
}

/** Global default SecretManager instance */
export const defaultSecretManager = new SecretManager();
