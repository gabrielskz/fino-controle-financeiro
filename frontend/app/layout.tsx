import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fino | Controle financeiro",
  description: "Organize receitas, contas e planos em um so lugar.",
  applicationName: "Fino",
};

export const viewport: Viewport = {
  themeColor: "#15231d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

