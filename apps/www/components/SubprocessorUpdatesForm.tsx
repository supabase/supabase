import { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label } from 'ui'

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

/**
 * Subscribe form for subprocessor update notifications.
 * Mirrors components/SecurityNewsletterForm.tsx, posting to the
 * /api-v2/submit-form-subprocessor-updates route (Customer.io "Subprocessor Alerts", topic_4).
 */
const SubprocessorUpdatesForm = () => {
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
      const res = await fetch('/api-v2/submit-form-subprocessor-updates', {
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
    <div className="border rounded-xl bg-surface-75 p-4 md:p-6 w-full max-w-lg not-prose">
      <p className="text-foreground-light text-sm text-pretty mb-6">
        <strong className="text-foreground">Subscribe to updates</strong>. Receive an email
        notification when Supabase updates its sub-processors. By submitting this form, you
        acknowledge and agree that Supabase will process your personal information in accordance
        with our{' '}
        <Link
          href="https://supabase.com/privacy"
          className="text-brand-link hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </Link>
        .
      </p>

      {status === 'success' ? (
        <p className="text-foreground text-sm">
          Thanks for subscribing! You'll receive an email when Supabase updates its sub-processors.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="subprocessor-first-name">First name</Label>
              <Input
                id="subprocessor-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subprocessor-last-name">Last name</Label>
              <Input
                id="subprocessor-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="subprocessor-email">Email</Label>
            <Input
              id="subprocessor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
          <Button variant="primary" size="large" type="submit" loading={status === 'loading'}>
            Subscribe
          </Button>
        </form>
      )}
    </div>
  )
}

export default SubprocessorUpdatesForm
