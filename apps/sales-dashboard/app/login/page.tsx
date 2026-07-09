'use client'

import { useActionState } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from 'ui'

import { sendMagicLink, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sales Dashboard</CardTitle>
          <CardDescription>
            {state.sent
              ? 'Check your email for a sign-in link.'
              : "We'll email you a link to sign in — no password needed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!state.sent && (
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                />
              </div>
              {state.error && <p className="text-sm text-destructive-600">{state.error}</p>}
              <Button type="submit" block loading={pending}>
                Send magic link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
