import { createHash } from "node:crypto";
import { CertificateClient } from "@azure/keyvault-certificates";
import { CryptographyClient } from "@azure/keyvault-keys";
import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity";

function env(key: string): string {
  return (process.env[key] ?? "").trim();
}

export type AzureKeyVaultConfig = {
  vaultUrl: string;
};

export function isAzureKeyVaultConfigured(): boolean {
  return Boolean(env("AZURE_KEY_VAULT_URL"));
}

export function resolveAzureKeyVaultConfig(): AzureKeyVaultConfig | null {
  const vaultUrl = env("AZURE_KEY_VAULT_URL");
  if (!vaultUrl) return null;
  return { vaultUrl };
}

export function getAzureCredential() {
  const tenantId = env("AZURE_TENANT_ID");
  const clientId = env("AZURE_CLIENT_ID");
  const clientSecret = env("AZURE_CLIENT_SECRET");
  if (tenantId && clientId && clientSecret) {
    return new ClientSecretCredential(tenantId, clientId, clientSecret);
  }
  return new DefaultAzureCredential();
}

export async function keyVaultResolveKeyId(
  certificateName: string,
  _teamId?: string
): Promise<string> {
  const config = resolveAzureKeyVaultConfig();
  if (!config?.vaultUrl) {
    throw new Error("Azure Key Vault ist nicht konfiguriert (AZURE_KEY_VAULT_URL).");
  }
  const name = certificateName.trim();
  if (!name) throw new Error("Zertifikatsname fehlt.");

  const certClient = new CertificateClient(config.vaultUrl, getAzureCredential());
  const cert = await certClient.getCertificate(name);
  if (!cert.keyId) {
    throw new Error("Schlüssel-ID nicht gefunden — Zertifikat evtl. noch nicht gemerged.");
  }
  return cert.keyId;
}

export async function keyVaultSignCbConnectPayload(
  keyId: string,
  signingInput: string,
  _teamId?: string
): Promise<string> {
  if (!isAzureKeyVaultConfigured()) {
    throw new Error("Azure Key Vault ist nicht konfiguriert.");
  }
  const digest = createHash("sha256").update(signingInput, "utf8").digest();
  const crypto = new CryptographyClient(keyId, getAzureCredential());
  const result = await crypto.sign("RS256", digest);
  return Buffer.from(result.result).toString("base64");
}

export async function keyVaultSignCbConnectPayloadForCertificate(
  certificateName: string,
  signingInput: string,
  teamId?: string
): Promise<{ signatureBase64: string; keyId: string }> {
  const keyId = await keyVaultResolveKeyId(certificateName, teamId);
  const signatureBase64 = await keyVaultSignCbConnectPayload(
    keyId,
    signingInput,
    teamId
  );
  return { signatureBase64, keyId };
}
