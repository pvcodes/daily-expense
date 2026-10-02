import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ExpenseProvider } from "@/hooks/useExpenses";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import BottomNav from "@/components/BottomNav";
import AddExpense from "@/components/AddExpense";

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
  themeColor: "#171b19",
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
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
          __html: `(function(){var dark=true;try{var t=localStorage.getItem("theme");if(t==="light")dark=false;}catch(e){}document.documentElement.classList.toggle("dark",dark);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",dark?"#171b19":"#f5f2e9");var sb=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(sb)sb.setAttribute("content",dark?"black-translucent":"default");})();`,
          }}
        />
      </head>
      <body className="h-full bg-canvas text-ink">
        <ExpenseProvider>
          <div className="mx-auto flex min-h-full w-full max-w-xl flex-col pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:px-3">
            {children}
          </div>
          <AddExpense />
          <BottomNav />
        </ExpenseProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
