import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ExpenseProvider } from "@/hooks/useExpenses";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Privacy-first spending tracker with insights",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expenses",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f6f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function apply(){var dark=null,accent=null;try{dark=localStorage.getItem("theme");accent=localStorage.getItem("expense-tracker.accent");}catch(e){}var d=dark==="dark";document.documentElement.classList.toggle("dark",d);if(accent)document.documentElement.dataset.accent=accent;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?"#09090b":"#f6f6f7");var sb=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(sb)sb.setAttribute("content",d?"black-translucent":"default");}apply();})();`,
          }}
        />
      </head>
      <body className="h-full bg-canvas text-ink">
        <ExpenseProvider>
          <div className="mx-auto flex min-h-full max-w-md flex-col pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
            <OfflineBanner />
            {children}
          </div>
          <BottomNav />
        </ExpenseProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
