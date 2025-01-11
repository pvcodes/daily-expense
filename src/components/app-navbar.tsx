'use client'

import { useCallback, useEffect } from "react"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { TypographyH3 } from "@/components/Typography"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { useUser, useExpenseActions } from "@/store/useExpenseStore"
import axios from "axios"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

// Custom hook to handle budget data fetching
const useBudgetSync = () => {
    const { status } = useSession()
    const { setBudgets } = useExpenseActions()

    useEffect(() => {
        const fetchBudgets = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await axios.get('/api/budget', {
                        params: { page: 1, limit: 10 }
                    })
                    setBudgets(response.data.data.budgets)
                } catch (error) {
                    // TODO
                    console.error('Failed to fetch budgets:', error)
                }
            }
        }

        fetchBudgets()
    }, [setBudgets, status])
}

export default function AppNavbar() {
    const router = useRouter()
    const { resetState } = useExpenseActions()
    const { status } = useUserSync()
    useBudgetSync()

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

    return (
        <div className="flex justify-between items-center border-b p-2">
            <Button
                onClick={handleHome}
                className="remove-all text-sm"
            >
                <TypographyH3>Expense Manager*</TypographyH3>
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
            <div className="fixed bottom-8 left-8 z-50">
                <Button
                    size='icon'
                    variant='secondary'
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="w-4" />
                </Button>
            </div>
            <div className="fixed bottom-8 right-8 z-50">
                <Button
                    size='icon'
                    variant='secondary'
                    onClick={() => router.forward()}
                >
                    <ChevronRight className="w-4" />
                </Button>
            </div>
        </div>
    )
}