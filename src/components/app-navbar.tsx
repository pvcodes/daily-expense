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

// NavButton component for consistent styling
const NavButton = ({
    children,
    onClick,
    disabled = false,
    className = ""
}: {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
    className?: string
}) => (
    <Button
        onClick={onClick}
        disabled={disabled}
        className={`text-sm ${className}`}
    >
        {children}
    </Button>
)

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
            <NavButton
                onClick={handleHome}
                className="remove-all"
            >
                <TypographyH3>Expense Manager*</TypographyH3>
            </NavButton>

            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavButton
                            onClick={handleAuth}
                            disabled={status === 'loading'}
                        >
                            {status === 'authenticated' ? 'Logout' : 'Login'}
                        </NavButton>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}