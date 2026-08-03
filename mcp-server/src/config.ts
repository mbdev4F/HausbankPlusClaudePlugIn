export type CertProviderName = "file" | "azure-keyvault";
export type SigningMode = "stub" | "custom";

export interface AppConfig {
  port: number;
  mcpToken?: string;
  apiBaseUrl: string;
  apiEnv: string;
  certProvider: CertProviderName;
  clientCertPath?: string;
  clientKeyPath?: string;
  clientPfxPath?: string;
  clientKeyPassphrase?: string;
  caBundlePath?: string;
  azureKeyVaultUrl?: string;
  azureKeyVaultCertName?: string;
  signingMode: SigningMode;
  signingKeyId?: string;
}

export function loadConfig(): AppConfig {
  const certProvider = (process.env.CERT_PROVIDER ?? "file") as CertProviderName;
  const signingMode = (process.env.SIGNING_MODE ?? "stub") as SigningMode;

  return {
    port: Number(process.env.PORT ?? 8787),
    mcpToken: process.env.HAUSBANK_PLUS_MCP_TOKEN || undefined,
    apiBaseUrl: process.env.HAUSBANK_API_BASE_URL ?? "https://api.example.deutsche-bank.com",
    apiEnv: process.env.HAUSBANK_API_ENV ?? "sandbox",
    certProvider,
    clientCertPath: process.env.CLIENT_CERT_PATH,
    clientKeyPath: process.env.CLIENT_KEY_PATH,
    clientPfxPath: process.env.CLIENT_PFX_PATH,
    clientKeyPassphrase: process.env.CLIENT_KEY_PASSPHRASE,
    caBundlePath: process.env.CA_BUNDLE_PATH,
    azureKeyVaultUrl: process.env.AZURE_KEY_VAULT_URL,
    azureKeyVaultCertName: process.env.AZURE_KEY_VAULT_CERT_NAME,
    signingMode,
    signingKeyId: process.env.SIGNING_KEY_ID,
  };
}
