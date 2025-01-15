'use client'

import { Button } from "../ui/button";
import copy from 'clipboard-copy';
import { LucideShare2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";




export function ShareButton({ uid, className }: { uid: string; className?: string }) {

    const handleShare = async (e: React.MouseEvent<HTMLButtonElement>, uid: string) => {
        e.preventDefault();  // Prevents the Link navigation
        const url = `${window.location.origin}/bin/${uid}`;
        await copy(url);
        toast('Link copied to clipboard!');
    };

    return <Button
        size="icon"
        variant="outline"
        onClick={(e) => handleShare(e, uid)}
        className={cn(className, "text-gray-600")}
    >
        <LucideShare2 size="16" />
    </Button>
}