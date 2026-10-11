import "server-only";

export function supportContacts() {
  return {
    phone: process.env.STORE_SUPPORT_PHONE?.trim() || "07038975935",
    email: process.env.STORE_SUPPORT_EMAIL?.trim() || "Bebikavictoria@gmail.com",
    whatsapp: process.env.STORE_SUPPORT_WHATSAPP?.trim() || "07038975935",
  };
}

export function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return international ? `https://wa.me/${international}` : "";
}
