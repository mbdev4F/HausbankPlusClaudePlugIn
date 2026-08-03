/**
 * Deutsche Bank CB-Connect — Bootstrap aus Server-Env (.env.local).
 * Nur serverseitig; Werte nie an den Client zurückgeben (außer nicht-sensitive IDs).
 */

export type CbconEnvCredentials = {
  clientId: string;
  keyId: string;
  clientSecret: string;
  xCustomerIdentifier: string;
  certificateBase64: string;
  certificatePassword: string;
};

function env(key: string): string {
  const direct = (process.env[key] ?? "").trim();
  if (direct) return direct;
  // .env mit Leerzeichen vor dem Key: " CBCON_CLIENTID=…"
  for (const [k, v] of Object.entries(process.env)) {
    if (k.trim() === key && typeof v === "string") return v.trim();
  }
  return "";
}

/** Liest CBCON_* inkl. bekannter Schreibvarianten (CERTTIFICATE, PASSWORT). */
export function readCbconEnv(): CbconEnvCredentials {
  return {
    clientId: env("CBCON_CLIENTID"),
    keyId: env("CBCON_KEYID"),
    clientSecret: env("CBCON_CLIENTSECRET"),
    xCustomerIdentifier: env("CBCON_XCUSTOMERIDENTIFIER"),
    certificateBase64:
      env("CBCON_CERTIFICATEBASE64") || env("CBCON_CERTTIFICATEBASE64"),
    certificatePassword:
      env("CBCON_CERTIFICATEPASSWORD") || env("CBCON_CERTIFICATEPASSWORT"),
  };
}

/** Nur Sandbox/Dev: TLS-Serverprüfung abschalten (Node kennt DB-CA nicht). */
export function readCbconTlsInsecure(): boolean {
  const v = env("CBCON_TLS_INSECURE").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function hasCbconEnv(): boolean {
  const e = readCbconEnv();
  return Boolean(
    e.clientId ||
      e.keyId ||
      e.clientSecret ||
      e.xCustomerIdentifier ||
      e.certificateBase64 ||
      e.certificatePassword
  );
}
