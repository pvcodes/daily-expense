import AppNavbar from "@/components/app-navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { Suspense } from "react";
import Loading from "./loading";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (

        <>
            <AppSidebar />
            <div className="w-full lg:w-3/5 mx-auto">
                <AppNavbar />
                <Suspense fallback={<Loading />}>
                    {children}
                </Suspense>
            </div>

        </>)
}
