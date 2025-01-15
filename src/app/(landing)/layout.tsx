'use client'
import { TypographyH3 } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constant";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname()
    return (

        <div className="w-full">

            <nav className="bg-white shadow-md py-4 px-6">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link href='/'> <TypographyH3>{APP_NAME}</TypographyH3></Link>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => signIn()} disabled={pathname === '/signin'}>
                        Sign In or Sign Up
                    </Button>
                </div>
            </nav>
            {/* <AppNavbar /> */}
            {children}
        </div>

    )
}
