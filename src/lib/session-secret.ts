export function configuredSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || /^(replace[-_]|change[-_]?me|your[-_]?|example[-_])/i.test(secret)) return null;
  return secret;
}
