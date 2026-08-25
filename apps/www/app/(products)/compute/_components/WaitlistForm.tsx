'use client'

import { CircleAlert } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  TextArea,
} from 'ui'
import { Alert } from 'ui/src/components/shadcn/ui/alert'

interface FormData {
  name: string
  email: string
  company: string
  useCase: string
  details: string
}

const defaultFormValue: FormData = {
  name: '',
  email: '',
  company: '',
  useCase: '',
  details: '',
}

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

export function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>(defaultFormValue)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [startTime, setStartTime] = useState(0)

  useEffect(() => {
    setStartTime(Date.now())
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setErrors({})
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.name) newErrors.name = 'This field is required'
    if (!formData.email) newErrors.email = 'This field is required'
    else if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email address'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Spam prevention: reject if submitted implausibly fast.
    if ((Date.now() - startTime) / 1000 < 3) {
      setErrors({ general: 'Submission too fast. Please try again.' })
      return
    }

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api-v2/submit-form-workers-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, honeypot }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const errorData = await response.json()
        setErrors({ general: errorData.message ?? 'Submission failed. Please try again.' })
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="border border-border rounded-lg bg-surface-75 p-6 md:p-8 w-full max-w-lg flex flex-col items-center gap-2 text-center">
        <p className="text-foreground font-medium">You&apos;re on the list</p>
        <p className="text-foreground-lighter text-sm">
          We&apos;ll reach out as invites roll out during the Private Alpha.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-border rounded-lg bg-surface-75 p-6 md:p-8 w-full max-w-lg flex flex-col gap-4 text-left"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-foreground-light flex justify-between text-left">
          Name
          {errors.name && <span className="text-foreground-muted text-xs">{errors.name}</span>}
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Jane Doe"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-foreground-light flex justify-between text-left">
          Work email
          {errors.email && <span className="text-foreground-muted text-xs">{errors.email}</span>}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="jane@company.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="company" className="text-foreground-light text-left">
          Company
        </Label>
        <Input
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Company name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="useCase" className="text-foreground-light text-left">
          What will you run on Compute?
        </Label>
        <Select
          value={formData.useCase}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, useCase: value }))}
        >
          <SelectTrigger id="useCase">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sandboxes">Sandboxes for AI agents</SelectItem>
            <SelectItem value="services">Backend services</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="details" className="text-foreground-light text-left">
          Tell us more
        </Label>
        <TextArea
          id="details"
          name="details"
          value={formData.details}
          onChange={handleChange}
          placeholder="What are you building, and what would you run on Compute?"
          rows={3}
        />
      </div>

      {/* Honeypot: hidden from real users, catches basic bots. */}
      <input
        type="text"
        name="honeypot"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <Separator />

      <Button type="submit" block size="medium" loading={isSubmitting} disabled={isSubmitting}>
        Join the waitlist
      </Button>

      <p className="text-foreground-lighter text-xs text-left">
        By submitting this form, I confirm that I have read and understood the{' '}
        <Link href="/privacy" className="text-foreground hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      {errors.general && (
        <Alert className="flex gap-2 text-foreground text-sm">
          <CircleAlert className="w-3 h-3 shrink-0" /> <span>{errors.general}</span>
        </Alert>
      )}
    </form>
  )
}
