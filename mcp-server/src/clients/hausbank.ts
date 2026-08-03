import type { AppConfig } from "../config.js";
import type { CertificateProvider } from "../auth/certificate.js";
import type { SigningProvider } from "../auth/signing.js";

export interface StubResult {
  status: "not_implemented";
  domain: string;
  operation: string;
  message: string;
  hint: string;
  echo?: Record<string, unknown>;
  meta: {
    apiBaseUrl: string;
    apiEnv: string;
    certProvider: string;
    signingMode: string;
  };
}

/**
 * Thin API façade. Methods become real HTTP calls once OpenAPI specs land.
 * Auth material is resolved per call so Key Vault rotation is picked up.
 */
export class HausbankApiClient {
  constructor(
    private readonly config: AppConfig,
    private readonly certs: CertificateProvider,
    private readonly signing: SigningProvider,
  ) {}

  private stub(domain: string, operation: string, echo?: Record<string, unknown>): StubResult {
    return {
      status: "not_implemented",
      domain,
      operation,
      message: `${operation} is scaffolded. Wire the OpenAPI operation and signing next.`,
      hint: `Drop the spec into docs/api-specs/ and map it in mcp-server/src/clients/`,
      echo,
      meta: {
        apiBaseUrl: this.config.apiBaseUrl,
        apiEnv: this.config.apiEnv,
        certProvider: this.config.certProvider,
        signingMode: this.config.signingMode,
      },
    };
  }

  async probeAuth(): Promise<{ certSource: string; signingMode: string }> {
    const tls = await this.certs.getTlsMaterial();
    return { certSource: tls.source, signingMode: this.signing.mode };
  }

  listGlobalAccounts(params: Record<string, unknown>) {
    return this.stub("balances", "list_global_accounts", params);
  }

  getRealtimeBalance(params: Record<string, unknown>) {
    return this.stub("balances", "get_realtime_balance", params);
  }

  getAccountStatement(params: Record<string, unknown>) {
    return this.stub("statements", "get_account_statement", params);
  }

  createZipaPayment(params: Record<string, unknown>) {
    return this.stub("payments", "create_zipa_payment", params);
  }

  verifyPayee(params: Record<string, unknown>) {
    return this.stub("vop", "verify_payee", params);
  }

  submitForApproval(params: Record<string, unknown>) {
    return this.stub("approvals", "submit_for_approval", params);
  }

  approvePayment(params: Record<string, unknown>) {
    return this.stub("approvals", "approve_payment", params);
  }

  rejectPayment(params: Record<string, unknown>) {
    return this.stub("approvals", "reject_payment", params);
  }

  sendPaymentToBank(params: Record<string, unknown>) {
    return this.stub("payments", "send_payment_to_bank", params);
  }

  getSwiftPaymentStatus(params: Record<string, unknown>) {
    return this.stub("swift", "get_swift_payment_status", params);
  }

  initiateFxForward(params: Record<string, unknown>) {
    return this.stub("fx", "initiate_fx_forward", params);
  }

  getFxForwardStatus(params: Record<string, unknown>) {
    return this.stub("fx", "get_fx_forward_status", params);
  }
}
