'use client'

import { useCallback, useEffect, useState } from "react"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { TypographyP } from "@/components/Typography"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { useUser, useExpenseActions } from "@/store/useExpenseStore"
import { ChevronLeft, ChevronRight, Terminal, X } from "lucide-react"
import { Alert, AlertDescription, } from "@/components/ui/alert"
import Link from "next/link"
import { useHasShowNotification, useUiActions } from "@/store/useUiStore"


// Custom hook to handle user data synchronization
const useUserSync = () => {
    const { status, data: sessionData } = useSession()
    const user = useUser()
    const { setUser } = useExpenseActions()

    useEffect(() => {
        if (status === 'authenticated' && !user && sessionData?.user) {
            const userData = {
                ...sessionData.user,
                email: sessionData.user.email ?? undefined
            }
            setUser(userData)
        }
    }, [status, sessionData?.user, setUser, user])

    return { status }
}

export default function AppNavbar() {
    const router = useRouter()
    const { resetState } = useExpenseActions()
    const { setHasShowNoti } = useUiActions()
    const hasShowNoti = useHasShowNotification()
    const { status } = useUserSync()
    // useBudgetSync()

    const handleSignOut = useCallback(() => {
        resetState()
        signOut({ callbackUrl: '/' })
    }, [resetState])

    const handleHome = useCallback(() => {
        router.push('/')
    }, [router])

    const handleAuth = useCallback(() => {
        if (status === 'authenticated') {
            handleSignOut()
        } else if (status === 'unauthenticated') {
            signIn()
        }
    }, [status, handleSignOut])


    const [showNotification, setShowNotification] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowNotification(false);
            setHasShowNoti()
        }, 7000);

        return () => clearTimeout(timer);
    }, [setHasShowNoti]);

    const handleRemoveNotification = () => {
        setShowNotification(false);
        setHasShowNoti()
    };


    return (
        <>
            {!hasShowNoti && showNotification && (
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
            )}

            <div className="flex justify-between items-center border-b p-2">
                <div className="lg:hidden">
                    <Button
                        size='icon'
                        variant='secondary'
                        onClick={() => router.back()}
                        className="mr-1"
                    >
                        <ChevronLeft className="w-4" />
                    </Button>
                    <Button
                        size='icon'
                        variant='secondary'
                        onClick={() => router.back()}
                    >
                        <ChevronRight className="w-4" />
                    </Button>
                </div>
                <Button
                    onClick={handleHome}
                    className="remove-all text-sm"
                >
                    <TypographyP className="font-bold lg:text-2xl">Expense Manager*</TypographyP>
                </Button>

                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <Button
                                onClick={handleAuth}
                                disabled={status === 'loading'}
                                className="text-sm"

                            >
                                {status === 'authenticated' ? 'Logout' : 'Login'}
                            </Button>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div >
        </>
    )
}