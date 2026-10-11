import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Toria Accessories and Fit | Style that completes you", template: "%s | Toria Accessories" },
  description: "Discover considered bags and sandals at Toria Accessories and Fit. Thoughtfully chosen style, delivered across Nigeria.",
  openGraph: {
    title: "Toria Accessories and Fit",
    description: "Style that completes you. Discover bags and sandals, thoughtfully chosen for everyday life.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG">
      <body><Header /><main>{children}</main><Footer /></body>
    </html>
  );
}
