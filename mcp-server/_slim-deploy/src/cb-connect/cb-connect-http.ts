import https from "node:https";
import { URL } from "node:url";

import { readCbconTlsInsecure } from "./env-config";
import { extractCaPemsFromP12 } from "./p12-tls";

const DEFAULT_TIMEOUT_MS = 35_000;

export type MtlsOptions = {
  pfx: Buffer;
  passphrase: string;
  /** Zusätzliche CA-PEMs; Standard: alle Zertifikate aus dem P12. */
  caPems?: string[];
  /** true = rejectUnauthorized false (nur Sandbox). */
  insecure?: boolean;
};

function resolveMtlsTlsOptions(mtls: MtlsOptions): {
  ca?: string | string[];
  rejectUnauthorized: boolean;
} {
  const fromP12 =
    mtls.caPems ?? extractCaPemsFromP12(mtls.pfx, mtls.passphrase).caPems;
  const insecure = mtls.insecure ?? readCbconTlsInsecure();
  return {
    ...(fromP12.length > 0 ? { ca: fromP12 } : {}),
    rejectUnauthorized: !insecure,
  };
}

export function formatTlsError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("unable to get local issuer certificate") ||
    msg.includes("self-signed certificate") ||
    msg.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE")
  ) {
    return (
      "TLS: Das Server-Zertifikat von api.sbx.baas.db.com wird von Node.js nicht vertraut. " +
      "Für lokale Sandbox-Tests in .env.local setzen: CBCON_TLS_INSECURE=true " +
      "(oder Bank-CA-Zertifikat ins PKCS#12 aufnehmen). Original: " +
      msg
    );
  }
  return msg;
}

export type MtlsResponse = {
  status: number;
  body: string;
  headers: Record<string, string>;
};

function normalizeHeaders(
  raw: NodeJS.Dict<string | string[] | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
  }
  return out;
}

export function httpsRequest(options: {
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  mtls?: MtlsOptions;
  timeoutMs?: number;
}): Promise<MtlsResponse> {
  const u = new URL(options.url);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const tlsOptions: https.RequestOptions = {
    hostname: u.hostname,
    port: u.port ? Number(u.port) : 443,
    path: `${u.pathname}${u.search}`,
    method: options.method,
    headers: options.headers,
    rejectUnauthorized: true,
  };

  if (options.mtls) {
    tlsOptions.pfx = options.mtls.pfx;
    tlsOptions.passphrase = options.mtls.passphrase;
    Object.assign(tlsOptions, resolveMtlsTlsOptions(options.mtls));
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      tlsOptions,
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
            headers: normalizeHeaders(res.headers),
          });
        });
      }
    );

    req.on("error", (err) => reject(new Error(formatTlsError(err))));
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Zeitüberschreitung bei der API-Anfrage."));
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}

/** HTTPS mit Client-Zertifikat (mTLS). */
export function mtlsRequest(
  options: {
    url: string;
    method: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  } & MtlsOptions
): Promise<MtlsResponse> {
  const { url, method, headers, body, timeoutMs, pfx, passphrase, caPems, insecure } =
    options;
  return httpsRequest({
    url,
    method,
    headers,
    body,
    timeoutMs,
    mtls: { pfx, passphrase, caPems, insecure },
  });
}

export function basicAuthHeader(clientId: string, clientSecret: string): string {
  const token = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString(
    "base64"
  );
  return `Basic ${token}`;
}

export function truncateErrorBody(body: string, max = 280): string {
  const t = body.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}
