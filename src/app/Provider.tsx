'use client';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider } from "@/components/ui/sidebar"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState } from "react";


const Providers = ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <SidebarProvider defaultOpen>
                    {children}
                </SidebarProvider>
                <Toaster />
                {/* <ReactQueryDevtools initialIsOpen={false} /> */}
            </QueryClientProvider>
        </SessionProvider>
    );
};

export default Providers;