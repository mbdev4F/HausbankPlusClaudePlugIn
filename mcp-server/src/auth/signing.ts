import type { AppConfig } from "../config.js";

export interface SignRequest {
  method: string;
  path: string;
  body?: string;
  timestamp?: string;
}

export interface SignResult {
  headers: Record<string, string>;
  /** Optional body rewrite if the bank scheme mutates payload */
  body?: string;
  mode: string;
}

export interface SigningProvider {
  readonly mode: string;
  sign(request: SignRequest): Promise<SignResult>;
}

class StubSigningProvider implements SigningProvider {
  readonly mode = "stub";

  async sign(request: SignRequest): Promise<SignResult> {
    return {
      mode: this.mode,
      headers: {
        "X-Hausbank-Signing": "stub",
        "X-Hausbank-Path": request.path,
      },
    };
  }
}

/**
 * Placeholder for the bank-specific signing framework you will provide.
 * Drop your algorithm here; keep this interface so tools stay unchanged.
 */
class CustomSigningProvider implements SigningProvider {
  readonly mode = "custom";

  constructor(private readonly config: AppConfig) {}

  async sign(_request: SignRequest): Promise<SignResult> {
    throw new Error(
      `Custom signing not wired yet (keyId=${this.config.signingKeyId ?? "n/a"}). Provide the signing code sample.`,
    );
  }
}

export function createSigningProvider(config: AppConfig): SigningProvider {
  if (config.signingMode === "custom") {
    return new CustomSigningProvider(config);
  }
  return new StubSigningProvider();
}
