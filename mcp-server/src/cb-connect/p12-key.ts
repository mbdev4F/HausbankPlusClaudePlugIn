import forge from "node-forge";

/** Privater Schlüssel aus PKCS#12 (für CB-Connect HTTP-Signatur). */
export function getPrivateKeyFromP12(
  pfx: Buffer,
  passphrase: string
): forge.pki.PrivateKey {
  const der = forge.util.createBuffer(pfx.toString("binary"));
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, passphrase);

  const shrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const shroudedBag =
    shrouded[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;
  if (shroudedBag) return shroudedBag;

  const plain = p12.getBags({ bagType: forge.pki.oids.keyBag });
  const plainBag = plain[forge.pki.oids.keyBag]?.[0]?.key;
  if (plainBag) return plainBag;

  throw new Error(
    "Kein privater Schlüssel im PKCS#12 gefunden (Signatur nicht möglich)."
  );
}
