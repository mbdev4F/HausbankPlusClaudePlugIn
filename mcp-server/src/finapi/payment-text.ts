/** SEPA-Zeichensatz laut finAPI Payment Data Validation. */

const UMLAUT_MAP: Record<string, string> = {
  ä: "ae",
  Ä: "AE",
  ö: "oe",
  Ö: "OE",
  ü: "ue",
  Ü: "UE",
  ß: "ss",
};

const ALLOWED =
  /[a-zA-Z0-9\/\-\?:\(\)\.\,\'\+\s]/;

export function sanitizeSepaText(input: string, maxLen: number): string {
  let s = input.trim();
  for (const [from, to] of Object.entries(UMLAUT_MAP)) {
    s = s.split(from).join(to);
  }
  const out: string[] = [];
  for (const ch of s) {
    if (ALLOWED.test(ch)) out.push(ch);
    else if (ch === " ") out.push(" ");
  }
  return out.join("").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

/** endToEndId: max. 35 Zeichen, erlaubter Zeichensatz. */
export function sanitizeSepaEndToEndId(input: string): string {
  const raw = sanitizeSepaText(input.replace(/[^a-zA-Z0-9]/g, ""), 35);
  return raw || "ZLREF";
}
