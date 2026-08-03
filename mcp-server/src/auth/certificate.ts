import { readFile } from "node:fs/promises";
import type { AppConfig } from "../config.js";

export interface TlsMaterial {
  /** PEM cert or undefined when using PFX */
  cert?: Buffer;
  key?: Buffer;
  pfx?: Buffer;
  passphrase?: string;
  ca?: Buffer;
  source: "file" | "azure-keyvault" | "none";
}

export interface CertificateProvider {
  readonly name: string;
  getTlsMaterial(): Promise<TlsMaterial>;
}

class FileCertificateProvider implements CertificateProvider {
  readonly name = "file";

  constructor(private readonly config: AppConfig) {}

  async getTlsMaterial(): Promise<TlsMaterial> {
    if (this.config.clientPfxPath) {
      return {
        pfx: await readFile(this.config.clientPfxPath),
        passphrase: this.config.clientKeyPassphrase,
        ca: this.config.caBundlePath ? await readFile(this.config.caBundlePath) : undefined,
        source: "file",
      };
    }

    if (!this.config.clientCertPath || !this.config.clientKeyPath) {
      return { source: "none" };
    }

    return {
      cert: await readFile(this.config.clientCertPath),
      key: await readFile(this.config.clientKeyPath),
      passphrase: this.config.clientKeyPassphrase,
      ca: this.config.caBundlePath ? await readFile(this.config.caBundlePath) : undefined,
      source: "file",
    };
  }
}

/**
 * Production path: load cert from Azure Key Vault.
 * Implementation will use @azure/keyvault-certificates + Managed Identity
 * once we wire real bank calls. Stub keeps the interface stable.
 */
class AzureKeyVaultCertificateProvider implements CertificateProvider {
  readonly name = "azure-keyvault";

  constructor(private readonly config: AppConfig) {}

  async getTlsMaterial(): Promise<TlsMaterial> {
    if (!this.config.azureKeyVaultUrl || !this.config.azureKeyVaultCertName) {
      throw new Error(
        "Azure Key Vault provider requires AZURE_KEY_VAULT_URL and AZURE_KEY_VAULT_CERT_NAME",
      );
    }

    // TODO: fetch certificate (and optionally sign-only key) via DefaultAzureCredential
    return {
      source: "azure-keyvault",
    };
  }
}

export function createCertificateProvider(config: AppConfig): CertificateProvider {
  if (config.certProvider === "azure-keyvault") {
    return new AzureKeyVaultCertificateProvider(config);
  }
  return new FileCertificateProvider(config);
}
