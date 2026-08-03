import {
  buildCbConnectSignatureHeader,
  buildCbConnectSigningInput,
  resolveCbConnectSignatureKeyId,
} from "./cb-connect-signing-core.js";
import { keyVaultSignCbConnectPayloadForCertificate } from "../azure-key-vault/signing.js";

/**
 * CB-Connect-Signatur mit privatem Schlüssel in Azure Key Vault (statt PKCS#12).
 * Für signierte DB-API-Aufrufe, sobald das Zertifikat im Vault gemerged ist.
 */
export async function cbConnectSignGetWithKeyVault(options: {
  certificateName: string;
  url: string;
  dateHeader: string;
  corporateSealKeyId: string;
}): Promise<{ dateHeader: string; signatureHeader: string }> {
  const { signingInput } = buildCbConnectSigningInput({
    url: options.url,
    method: "GET",
    dateHeader: options.dateHeader,
  });
  const { signatureBase64 } = await keyVaultSignCbConnectPayloadForCertificate(
    options.certificateName,
    signingInput
  );
  return {
    dateHeader: options.dateHeader,
    signatureHeader: buildCbConnectSignatureHeader({
      keyId: resolveCbConnectSignatureKeyId(options.corporateSealKeyId),
      method: "GET",
      signatureBase64,
    }),
  };
}

export async function cbConnectSignPostWithKeyVault(options: {
  certificateName: string;
  url: string;
  body: string;
  dateHeader: string;
  corporateSealKeyId: string;
}): Promise<{
  dateHeader: string;
  signatureHeader: string;
  digestHeader: string;
}> {
  const { signingInput, digestHeader } = buildCbConnectSigningInput({
    url: options.url,
    method: "POST",
    dateHeader: options.dateHeader,
    body: options.body,
  });
  if (!digestHeader) {
    throw new Error("Digest für POST-Signatur fehlt.");
  }
  const { signatureBase64 } = await keyVaultSignCbConnectPayloadForCertificate(
    options.certificateName,
    signingInput
  );
  return {
    dateHeader: options.dateHeader,
    digestHeader,
    signatureHeader: buildCbConnectSignatureHeader({
      keyId: resolveCbConnectSignatureKeyId(options.corporateSealKeyId),
      method: "POST",
      signatureBase64,
    }),
  };
}
