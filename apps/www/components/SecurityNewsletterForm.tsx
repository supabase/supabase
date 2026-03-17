import { useState } from 'react'
import { Button, Input_Shadcn_, Label_Shadcn_ } from 'ui'

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

const SecurityNewsletterForm = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!firstName || !lastName || !email) {
      setErrorMessage('All fields are required.')
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api-v2/submit-form-security-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Something went wrong')
      }

      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6 max-w-sm">
        <h2 className="text-2xl text-foreground mb-2">Security Newsletter</h2>
        <p className="text-foreground-light text-sm text-pretty">
          Sign up for the Supabase Security Newsletter. Receive updates during security incidents.
        </p>
      </div>

      <div className="border rounded-xl bg-surface-75 p-4 md:p-6 w-full max-w-lg">
        {status === 'success' ? (
          <p className="text-foreground text-sm">
            Thanks for subscribing! You'll receive security updates from Supabase.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label_Shadcn_ htmlFor="security-first-name">First Name</Label_Shadcn_>
                <Input_Shadcn_
                  id="security-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label_Shadcn_ htmlFor="security-last-name">Last Name</Label_Shadcn_>
                <Input_Shadcn_
                  id="security-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label_Shadcn_ htmlFor="security-email">Email Address</Label_Shadcn_>
              <Input_Shadcn_
                id="security-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
              />
            </div>
            {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
            <Button type="primary" size="large" htmlType="submit" loading={status === 'loading'}>
              Subscribe
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default SecurityNewsletterForm
