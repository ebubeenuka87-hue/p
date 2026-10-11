export function customerReturnPath(value: string | undefined) {
  if (!value) return "/account";
  try {
    const url = new URL(value, "https://toria.invalid");
    if (url.origin !== "https://toria.invalid" || url.pathname.startsWith("/admin") || url.pathname.startsWith("/\\")) {
      return "/account";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}
