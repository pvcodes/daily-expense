// import { useCallback, useEffect, useState } from "react"
// import {
//     NavigationMenu,
//     NavigationMenuItem,
//     NavigationMenuList,
// } from "@/components/ui/navigation-menu"
// import { Button } from "./ui/button"
// import { useRouter } from "next/navigation"
// import { signIn, signOut, useSession } from "next-auth/react"
// import { useUser, useExpenseActions } from "@/store/useExpenseStore"
// import { ChevronLeft, ChevronRight, Terminal, X } from "lucide-react"
// import { Alert, AlertDescription, } from "@/components/ui/alert"
// import { useHasShowNotification, useUiActions } from "@/store/useUiStore"

// TODO: Clear the clutter

import Link from "next/link"
import { TypographyP } from "@/components/Typography"
import { SidebarTrigger } from "./ui/sidebar"

export default function AppNavbar() {
    // const { setHasShowNoti } = useUiActions()
    // const hasShowNoti = useHasShowNotification()

    // const [showNotification, setShowNotification] = useState(true);

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setShowNotification(false);
    //         setHasShowNoti()
    //     }, 7000);

    //     return () => clearTimeout(timer);
    // }, [setHasShowNoti]);

    // const handleRemoveNotification = () => {
    //     setShowNotification(false);
    //     setHasShowNoti()
    // };


    return (
        <>
            {/* {!hasShowNoti && showNotification && (
                <div className={`
                    transform transition-all duration-300 ease-in-out
                    ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
                `}>
                    <Alert className="bg-gray-200 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shine" />
                        <Terminal className="h-4 w-4" />
                        <AlertDescription className="flex justify-between items-center">
                            <TypographyP className="animate-fadeIn">
                                Try the new pastebin feature! Create and share code snippets or text files with ease.
                                <Link
                                    href="/bin"
                                    className="text-blue-500 hover:text-blue-600 transition-colors duration-200 ml-1"
                                >
                                    /bin
                                </Link>
                            </TypographyP>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={handleRemoveNotification}
                                className="hover:scale-105 transition-transform duration-200"
                            >
                                <X />
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            )} */}

            <div className="flex justify-between items-center border-b p-2">
                <Link href='/'>
                    <TypographyP className="font-bold lg:text-2xl">Expense Manager*</TypographyP>
                </Link>
                <SidebarTrigger />
            </div >
        </>
    )
}