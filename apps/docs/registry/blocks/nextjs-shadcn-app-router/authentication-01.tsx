'use client'

import { createClient } from '~/registry/blocks-utils/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/registry/default/ui/card'
import { Input } from '~/registry/default/ui/input'
import { Label } from '~/registry/default/ui/label'
import { Button } from '~/registry/default/ui/button'
import { useState } from 'react'

export const description =
  "A simple login form with email and password. The submit button says 'Sign in'."
export const iframeHeight = '600px'
export const containerClassName = 'w-full h-screen flex items-center justify-center px-4'

export default function LoginForm() {
  const [errorState, setErrorState] = useState('')

  const signIn = async (formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error && error.message) {
      setErrorState(error.message)
    }

    return email
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your email below to login to your account.</CardDescription>
      </CardHeader>
      <form action={signIn}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" type="submit">
            Sign in
          </Button>
          <p className="text-sm text-destructive">{errorState}</p>
        </CardFooter>
      </form>
    </Card>
  )
}
