import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pocket Ledger",
  description: "A private, personal expense tracker",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ledger" },
  applicationName: "Pocket Ledger"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#faf6ef" }, { media: "(prefers-color-scheme: dark)", color: "#241d29" }]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
