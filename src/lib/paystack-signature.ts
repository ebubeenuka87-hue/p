import { createHmac, timingSafeEqual } from "node:crypto";

export function validPaystackSignature(rawBody: string, signature: string | null, secret?: string) {
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
