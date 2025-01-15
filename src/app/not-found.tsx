'use client'
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
            <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                        404 - Page Not Found
                    </h1>
                    <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                    <Button
                        variant="default"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2"
                    >
                        <HomeIcon className="h-4 w-4" />
                        Return Home
                    </Button>
                </div>
                <div className="mt-8">
                    <div className="inline-flex items-center justify-center rounded-lg border px-3 py-1 text-sm">
                        Error Code: 404
                    </div>
                </div>
            </div>
        </div>
    );
}