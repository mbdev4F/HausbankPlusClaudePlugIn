import forge from "node-forge";

export type P12TlsMaterial = {
  /** PEM-Zertifikate aus dem P12 (inkl. CA-Kette) für Server-Trust. */
  caPems: string[];
};

/** CA-/Client-Zertifikate aus PKCS#12 für Node-TLS (mTLS + ggf. Issuer-Trust). */
export function extractCaPemsFromP12(
  pfx: Buffer,
  passphrase: string
): P12TlsMaterial {
  const der = forge.util.createBuffer(pfx.toString("binary"));
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, passphrase);

  const caPems: string[] = [];
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  for (const bag of certBags[forge.pki.oids.certBag] ?? []) {
    if (bag.cert) {
      caPems.push(forge.pki.certificateToPem(bag.cert));
    }
  }

  return { caPems };
}
