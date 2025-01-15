'use client'
import { useCallback, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

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

const INITIAL_FORM_STATE: FormState = {
    email: '',
    password: '',
    name: '',
    img_url: ''
}

const INITIAL_AUTH_STATE: AuthState = {
    isLoading: false,
    error: '',
    tab: 'signin'
}

const MIN_PASSWORD_LENGTH = 6

export default function AuthTabs() {
    const router = useRouter()
    const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE)
    const [authState, setAuthState] = useState<AuthState>(INITIAL_AUTH_STATE)

    const handleInputChange = useCallback((field: keyof FormState) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }))
    }, [])

    const setError = useCallback((error: string) => {
        setAuthState(prev => ({ ...prev, error, isLoading: false }))
    }, [])

    const handleTabChange = useCallback((tab: AuthTab) => {
        setAuthState(prev => ({ ...prev, tab, error: '' }))
    }, [])

    const validateSignIn = useCallback(({ email, password }: FormState) => {
        if (!email || !password) {
            setError('Email and password are required')
            return false
        }
        return true
    }, [setError])

    const validateSignUp = useCallback(({ name, email, password }: FormState) => {
        if (!name || !email || !password) {
            setError('Name, email and password are required')
            return false
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password should be at least ${MIN_PASSWORD_LENGTH} characters`)
            return false
        }
        return true
    }, [setError])

    const handleSignIn = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateSignIn(formData)) return

        setAuthState(prev => ({ ...prev, isLoading: true, error: '' }))

        try {
            const response = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false
            })

            if (response?.ok) {
                router.push('/dashboard')
            } else {
                setError('Sign in failed, please check your credentials')
            }
        } catch (err) {
            console.log(err)
            setError('An unexpected error occurred')
        }
    }, [formData, router, setError, validateSignIn])

    const handleSignUp = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateSignUp(formData)) return

        setAuthState(prev => ({ ...prev, isLoading: true, error: '' }))

        try {
            await axios.post('/api/user', formData)
            setAuthState(prev => ({ ...prev, tab: 'signin', isLoading: false }))
            setFormData(prev => ({
                ...prev,
                password: '',
                name: '',
                img_url: ''
            }))
        } catch (error) {
            console.log(error)
            setError('Failed to sign up')
        }
    }, [formData, setError, validateSignUp])

    const LoadingButton = useMemo(() => {
        const Component = () => (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {authState.tab === 'signin' ? 'Signing in...' : 'Signing up...'}
            </>
        );
        Component.displayName = 'LoadingButton';
        return Component;
    }, [authState.tab]);


    const ErrorAlert = useMemo(() => {
        if (!authState.error) return null
        return (
            <Alert variant="destructive">
                <AlertDescription className="flex items-center">
                    <AlertCircle size='16' className='mr-2'/>

                    {authState.error}
                </AlertDescription>
            </Alert>
        )
    }, [authState.error])

    const renderFormFields = useCallback((isSignIn: boolean) => {
        const fields = [
            !isSignIn && {
                id: 'name',
                label: 'Name',
                placeholder: 'John Doe',
                type: 'text'
            },
            {
                id: 'email',
                label: 'Email',
                placeholder: 'you@example.com',
                type: 'email'
            },
            {
                id: 'password',
                label: 'Password',
                type: 'password'
            },
            !isSignIn && {
                id: 'img_url',
                label: 'Profile Image URL (Optional)',
                placeholder: 'https://example.com/image.jpg',
                type: 'text'
            }
        ].filter(Boolean)

        return fields.map(field => field && (
            <div key={field.id} className="space-y-2">
                <Label htmlFor={`${authState.tab}-${field.id}`}>{field.label}</Label>
                <Input
                    id={`${authState.tab}-${field.id}`}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.id as keyof FormState] || ''}
                    onChange={handleInputChange(field.id as keyof FormState)}
                />
            </div>
        ))
    }, [authState.tab, formData, handleInputChange])

    return (
        <div className="h-full flex justify-center mt-4 lg:mt-16">
            <Tabs value={authState.tab} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin" onClick={() => handleTabChange('signin')}>
                        Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" onClick={() => handleTabChange('signup')}>
                        Sign Up
                    </TabsTrigger>
                </TabsList>

                {['signin', 'signup'].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{tab === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
                            </CardHeader>
                            <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp}>
                                <CardContent>
                                    {ErrorAlert}
                                    {renderFormFields(tab === 'signin')}
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={authState.isLoading}
                                    >
                                        {authState.isLoading ? <LoadingButton /> : (tab === 'signin' ? 'Sign In' : 'Sign Up')}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
AuthTabs.displayName = 'AuthTabs';
