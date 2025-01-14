import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* <AppSidebar /> */}
          {/* <div className="w-full"> */}
            {children}
          {/* </div> */}
        </Providers>
      </body>
    </html>
  );

}
