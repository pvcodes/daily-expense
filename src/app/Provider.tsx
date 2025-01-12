'use client';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from "@/components/ui/sonner"


export default function Providers({ children }: { children: ReactNode }) {

    return (
        <SessionProvider>
            {children}
            <Toaster />
        </SessionProvider>
    );
};