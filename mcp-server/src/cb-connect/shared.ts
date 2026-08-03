/**
 * Deutsche Bank CB-Connect API — Typen für Client-Formular.
 */

export type NativeBankSettingsSource = "none" | "stored" | "env" | "mixed";

export type NativeBankPublicSettings = {
  clientId: string;
  xCustomerIdentifier: string;
  keyId: string;
  hasClientSecret: boolean;
  hasStoredClientSecret: boolean;
  hasCertificatePassword: boolean;
  hasStoredCertificatePassword: boolean;
  hasCertificate: boolean;
  hasStoredCertificate: boolean;
  certificateFileName: string;
  /** CBCON_* in .env.local gesetzt (serverseitiger Test-Bootstrap). */
  hasEnvBootstrap: boolean;
  source: NativeBankSettingsSource;
  updatedAt: number | null;
};
export type NativeBankSavePayload = {
  clientId: string;
  clientSecret: string;
  xCustomerIdentifier: string;
  keyId: string;
  certificatePassword: string;
  certificateFileName: string;
  /** Base64 des PKCS#12/PEM; leer = unverändert */
  certificateBase64: string;
  clearClientSecret: boolean;
  clearCertificatePassword: boolean;
  clearCertificate: boolean;
};

export type NativeBankSaveResult =
  | { ok: true; settings: NativeBankPublicSettings }
  | { ok: false; error: string };

export type NativeBankImportFromEnvResult =
  | { ok: true; settings: NativeBankPublicSettings }
  | { ok: false; error: string };
