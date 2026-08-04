import forge from "node-forge";

import {
  buildCbConnectSignatureHeader,
  buildCbConnectSigningInput,
  resolveCbConnectSignatureKeyId,
} from "./cb-connect-signing-core";
import { getPrivateKeyFromP12 } from "./p12-key";

export {
  buildCbConnectSigningInput,
  buildCbConnectSignatureHeader,
  formatCbConnectGmtDate,
  parseCbConnectHealthStatus,
  resolveCbConnectSignatureKeyId,
} from "./cb-connect-signing-core";

export function signCbConnectPayload(
  signingInput: string,
  privateKey: forge.pki.PrivateKey
): string {
  const md = forge.md.sha256.create();
  md.update(signingInput, "utf8");
  const signature = (privateKey as forge.pki.rsa.PrivateKey).sign(md);
  return forge.util.encode64(signature);
}

export function createCbConnectSigner(
  pfx: Buffer,
  passphrase: string
): {
  signGet(url: string, dateHeader: string, corporateSealKeyId: string): {
    dateHeader: string;
    signatureHeader: string;
  };
  signPost(
    url: string,
    body: string,
    dateHeader: string,
    corporateSealKeyId: string
  ): {
    dateHeader: string;
    signatureHeader: string;
    digestHeader: string;
  };
} {
  const privateKey = getPrivateKeyFromP12(pfx, passphrase);

  return {
    signGet(url, dateHeader, corporateSealKeyId) {
      const { signingInput } = buildCbConnectSigningInput({
        url,
        method: "GET",
        dateHeader,
      });
      const signatureBase64 = signCbConnectPayload(signingInput, privateKey);
      return {
        dateHeader,
        signatureHeader: buildCbConnectSignatureHeader({
          keyId: resolveCbConnectSignatureKeyId(corporateSealKeyId),
          method: "GET",
          signatureBase64,
        }),
      };
    },
    signPost(url, body, dateHeader, corporateSealKeyId) {
      const { signingInput, digestHeader } = buildCbConnectSigningInput({
        url,
        method: "POST",
        dateHeader,
        body,
      });
      if (!digestHeader) {
        throw new Error("Digest für POST-Signatur fehlt.");
      }
      const signatureBase64 = signCbConnectPayload(signingInput, privateKey);
      return {
        dateHeader,
        digestHeader,
        signatureHeader: buildCbConnectSignatureHeader({
          keyId: resolveCbConnectSignatureKeyId(corporateSealKeyId),
          method: "POST",
          signatureBase64,
        }),
      };
    },
  };
}
