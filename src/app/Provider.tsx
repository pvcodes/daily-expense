'use client';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider } from "@/components/ui/sidebar"

const Providers = ({ children }: { children: ReactNode }) => {
    return (
        <SessionProvider>
            <SidebarProvider defaultOpen>
                {children}
            </SidebarProvider>
            <Toaster />
        </SessionProvider>
    );
};

export default Providers;