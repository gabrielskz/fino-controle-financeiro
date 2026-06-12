import type { Metadata, Viewport } from "next";

import { ThemeToggle } from "@/components/theme-toggle";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fino | Controle financeiro",
  description: "Organize receitas, contas e planos em um so lugar.",
  applicationName: "Fino",
  appleWebApp: {
    capable: true,
    title: "Fino",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1511" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('fino-theme');var dark=saved==='dark'||(!saved&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark)}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
