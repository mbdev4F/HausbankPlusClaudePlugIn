export type CertProviderName = "file" | "azure-keyvault";

export interface AppConfig {
  port: number;
  mcpToken?: string;
  certProvider: CertProviderName;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 8787),
    mcpToken: process.env.CB_CONNECT_MCP_TOKEN || process.env.HAUSBANK_PLUS_MCP_TOKEN || undefined,
    certProvider: (process.env.CERT_PROVIDER ?? "file") as CertProviderName,
  };
}
