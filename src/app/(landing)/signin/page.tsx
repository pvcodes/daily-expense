'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { getSession, signIn } from 'next-auth/react'
import { useUserActions } from '@/store/useUserStore'
import { User } from '@/types/user'

// Type definitions for better type safety
type AuthTab = 'signin' | 'signup'

interface FormState {
    email: string
    password: string
    name?: string
    img_url?: string
}

interface AuthState {
    isLoading: boolean
    error: string
    tab: AuthTab
}

export default function AuthTabs() {
    const router = useRouter()
    const { setUserAction } = useUserActions()

    // Combined form state
    const [formData, setFormData] = useState<FormState>({
        email: '',
        password: '',
        name: '',
        img_url: ''
    })

    // UI state
    const [authState, setAuthState] = useState<AuthState>({
        isLoading: false,
        error: '',
        tab: 'signin'
    })

    // Handle input changes
    const handleInputChange = (field: keyof FormState) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }))
    }

    // Set error helper
    const setError = (error: string) => {
        setAuthState(prev => ({ ...prev, error, isLoading: false }))
    }

    // Handle tab change
    const handleTabChange = (tab: AuthTab) => {
        setAuthState(prev => ({ ...prev, tab, error: '' }))
    }

    // Sign in handler
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        const { email, password } = formData

        if (!email || !password) {
            setError('Email and password are required')
            return
        }

        setAuthState(prev => ({ ...prev, isLoading: true, error: '' }))

        await signIn('credentials', {
            email,
            password,
            redirect: false
        }).then(async (response) => {
            if (response?.ok) {
                const session = await getSession()
                setUserAction(session?.user as User) // when res is true then session is defined
                return router.push('/dashboard')
            }
        }).catch(() => setError('Failed to sign in'))

    }

    // Sign up handler
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        const { name, email, password, img_url } = formData

        if (!name || !email || !password) {
            setError('Name, email and password are required')
            return
        }
        if (password.length < 6) {
            setError('Password should be more than 5 characters')
            return
        }

        setAuthState(prev => ({ ...prev, isLoading: true, error: '' }))

        try {
            await axios.post('/api/user', { name, email, password, img_url })
            setAuthState(prev => ({ ...prev, tab: 'signin', isLoading: false }))
            // Clear form except email for easy sign in
            setFormData(prev => ({
                ...prev,
                password: '',
                name: '',
                img_url: ''
            }))
        } catch (err) {
            // TODO
            setError('Failed to sign up')
            console.log(err)
        }
    }

    // Loading button content
    const LoadingButton = () => (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {authState.tab === 'signin' ? 'Signing in...' : 'Signing up...'}
        </>
    )

    return (
        <div className='h-full flex justify-center mt-4 lg:mt-16'>
            <Tabs value={authState.tab} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                        value="signin"
                        onClick={() => handleTabChange('signin')}
                    >
                        Sign In
                    </TabsTrigger>
                    <TabsTrigger
                        value="signup"
                        onClick={() => handleTabChange('signup')}
                    >
                        Sign Up
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign In</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSignIn}>
                            <CardContent className="space-y-4">
                                {authState.error && (
                                    <Alert variant="destructive" className='flex items-center'>
                                        <Button className='remove-all' size='icon'> <AlertCircle /></Button>
                                        <AlertDescription className='p-2' >{authState.error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="signin-email">Email</Label>
                                    <Input
                                        id="signin-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange('email')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signin-password">Password</Label>
                                    <Input
                                        id="signin-password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange('password')}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={authState.isLoading}
                                >
                                    {authState.isLoading ? <LoadingButton /> : 'Sign In'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="signup">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign Up</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSignUp}>
                            <CardContent className="space-y-4">
                                {authState.error && (
                                    <Alert variant="destructive" className='flex items-center'>
                                        <Button className='remove-all' size='icon'> <AlertCircle /></Button>
                                        <AlertDescription className='p-2' >{authState.error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">Name</Label>
                                    <Input
                                        id="signup-name"
                                        placeholder="Ben Dover"
                                        value={formData.name}
                                        onChange={handleInputChange('name')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange('email')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange('password')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-imgurl">Profile Image URL (Optional)</Label>
                                    <Input
                                        id="signup-imgurl"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.img_url}
                                        onChange={handleInputChange('img_url')}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={authState.isLoading}
                                >
                                    {authState.isLoading ? <LoadingButton /> : 'Sign Up'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}