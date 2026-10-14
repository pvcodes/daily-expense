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
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8f7f3" }, { media: "(prefers-color-scheme: dark)", color: "#202a25" }]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
