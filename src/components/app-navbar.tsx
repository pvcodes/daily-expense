'use client'
import {
    NavigationMenu,
    // NavigationMenuContent,
    NavigationMenuItem,
    // NavigationMenuLink,
    NavigationMenuList,
    // NavigationMenuTrigger,
    // navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { TypographyH3 } from "@/components/Typography"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { useUser } from "@/store/useExpenseStore"
import { useExpenseActions } from '@/store/useExpenseStore'
import { useEffect } from "react"
import axios from "axios"

export default function AppNavbar() {
    const user = useUser()
    const { status, data: sessionData } = useSession()
    const router = useRouter()
    const { setUser, setBudgets, resetState } = useExpenseActions()



    useEffect(() => {
        if (status === 'authenticated') {
            const fetchBudgetsData = async () => {
                const response = await axios.get('/api/budget', { params: { page: 1, limit: 10 } })
                setBudgets(response.data.data.budgets)
            }
            fetchBudgetsData()
        }
    }, [setBudgets, status])

    useEffect(() => {
        if (status === 'authenticated' && !user) {
            const user = {
                ...sessionData.user,
                email: sessionData.user.email ?? undefined
            }
            setUser(user)
            console.log('useffet', 9090)
        }
    }, [status, sessionData?.user, setUser, user])

    const handleSignOut = async () => {
        await resetState()
        signOut({ callbackUrl: '/' })
    }


    return (
        <div className="flex justify-between border-b p-2">
            <Button className="remove-all" onClick={() => router.push('/')}><TypographyH3>Expenses Manager</TypographyH3></Button>
            <NavigationMenu>
                <NavigationMenuList>
                    {/* <NavigationMenuItem>
                        <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <div className="p-2 min-w-10">
                                <p>hello</p>
                                <div>
                                    <Link href={'#'}>linke</Link>
                                </div>
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem> */}
                    <NavigationMenuItem className="text-sm">
                        {/* {JSON.stringify(user)} */}
                        <Button onClick={() => (status === 'authenticated' ? handleSignOut() : signIn())} disabled={status === 'loading'}> {status === 'authenticated' ? 'Logout' : 'Login'}</Button>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div >
    )
}

