'use client'

import { useState } from 'react'
import { Button, Input_Shadcn_ } from 'ui'

interface BookingFormProps {
  onSubmit: (data: {
    firstName: string
    lastName: string
    email: string
    guestEmails?: string[]
  }) => void
  onBack: () => void
  isSubmitting: boolean
  error: string | null
  onDismissError: () => void
  selectedDate: string
  selectedTimeLabel: string
  timezone: string
}

export default function BookingForm({
  onSubmit,
  onBack,
  isSubmitting,
  error,
  onDismissError,
  selectedDate,
  selectedTimeLabel,
  timezone,
}: BookingFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const dateLabel = (() => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    })
  })()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ firstName, lastName, email })
  }

  const isValid = firstName.trim() && lastName.trim() && email.trim()

  return (
    <div className="w-full h-full flex-1 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-md text-foreground-lighter hover:bg-surface-300/50 hover:text-foreground transition-colors"
          aria-label="Back to time selection"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-foreground text-sm font-medium">
          {dateLabel} at {selectedTimeLabel}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hs-firstName" className="text-foreground-light text-sm font-medium">
            First name *
          </label>
          <Input_Shadcn_
            id="hs-firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hs-lastName" className="text-foreground-light text-sm font-medium">
            Last name *
          </label>
          <Input_Shadcn_
            id="hs-lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hs-email" className="text-foreground-light text-sm font-medium">
            Email *
          </label>
          <Input_Shadcn_
            id="hs-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-destructive-200/30 border border-destructive-500/20 px-3 py-2.5">
            <p className="text-destructive-600 text-sm flex-1">{error}</p>
            <button
              type="button"
              onClick={onDismissError}
              className="text-destructive-600/60 hover:text-destructive-600 transition-colors flex-shrink-0 p-0.5"
              aria-label="Dismiss error"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        <Button
          htmlType="submit"
          type="primary"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          size="medium"
          block
          className="mt-auto"
        >
          {isSubmitting ? 'Booking...' : 'Confirm booking'}
        </Button>
      </form>
    </div>
  )
}
