import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppNavbar from "@/components/app-navbar";
import { Session } from "next-auth";
import Providers from "@/app/Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expenses Manager",
  description: "", // TODO
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  session: Session
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased p-2 max-w-2xl mx-auto space-y-6 lg:w-11/12`}
      >
        <Providers>
          <AppNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );

}
