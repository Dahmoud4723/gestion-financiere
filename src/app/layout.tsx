import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "Gestion Financière",
  description: "Application de gestion financière",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body
        className="min-h-full"
        style={{ background: "#06091b", color: "#e2e8f8", fontFamily: "'Inter', 'Noto Sans Arabic', system-ui, -apple-system, sans-serif" }}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
