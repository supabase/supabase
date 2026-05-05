'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Button,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import type { z } from 'zod'

import { submitFormAction } from '../go/actions/submitForm'
import { formCrmConfigSchema, formFieldSchema } from '../go/schemas'

/** Input-shape field type — fields with Zod defaults (`half`, `required`) are optional here. */
export type MarketingFormField = z.input<typeof formFieldSchema>
export type MarketingFormCrmConfig = z.input<typeof formCrmConfigSchema>

export interface MarketingFormProps {
  /** Form fields. The submit handler builds the payload from these by `name`. */
  fields: MarketingFormField[]
  /** Submit button label. */
  submitLabel: string
  /** Optional title shown above the form. */
  title?: string
  /** Optional description shown above the form. */
  description?: string
  /** Optional markdown disclaimer shown beneath the submit button. */
  disclaimer?: string
  /** Message shown after a successful submission. Ignored when `successRedirect` is set. */
  successMessage?: string
  /** URL to redirect the user to after a successful submission. Overrides `successMessage`. */
  successRedirect?: string
  /** CRM fan-out config — submits to HubSpot, Customer.io, and/or Notion in parallel. */
  crm?: MarketingFormCrmConfig
  /** Wraps the form in a styled card (border + padding). Defaults to `true`. */
  card?: boolean
  /** Extra class names applied to the outer wrapper. */
  className?: string
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

function FormField({
  field,
  value,
  onChange,
}: {
  field: MarketingFormField
  value: string
  onChange: (value: string) => void
}) {
  switch (field.type) {
    case 'text':
    case 'email':
      return (
        <Input_Shadcn_
          type={field.type}
          placeholder={field.placeholder}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'textarea':
      return (
        <TextArea_Shadcn_
          placeholder={field.placeholder}
          required={field.required}
          rows={field.rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'select':
      return (
        <Select_Shadcn_ value={value} onValueChange={onChange} required={field.required}>
          <SelectTrigger_Shadcn_>
            <SelectValue_Shadcn_ placeholder={field.placeholder} />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {field.options.map((opt) => (
              <SelectItem_Shadcn_ key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      )
    default: {
      const _exhaustive: never = field
      return null
    }
  }
}

export default function MarketingForm({
  fields,
  submitLabel,
  title,
  description,
  disclaimer,
  successMessage,
  successRedirect,
  crm,
  card = true,
  className,
}: MarketingFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, '']))
  )
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!crm) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[marketing/form] No CRM configured — form values:', values)
      }
      return
    }

    setSubmitState('loading')
    setErrorMessages([])

    const pageUri = typeof window !== 'undefined' ? window.location.href : undefined
    const pageName = typeof document !== 'undefined' ? document.title : undefined

    try {
      const result = await submitFormAction(crm, values, { pageUri, pageName })

      if (result.success) {
        if (successRedirect) {
          window.location.href = successRedirect
        } else {
          setSubmitState('success')
        }
      } else {
        setSubmitState('error')
        setErrorMessages(result.errors)
      }
    } catch (err: any) {
      console.error('[marketing/form] Form submission failed:', err)
      setSubmitState('error')
      setErrorMessages(['Something went wrong. Please try again.'])
    }
  }

  // Group fields into rows: half-width fields pair up, full-width fields get their own row
  const rows: MarketingFormField[][] = []
  let pendingHalf: MarketingFormField | null = null

  for (const field of fields) {
    if (field.half) {
      if (pendingHalf) {
        rows.push([pendingHalf, field])
        pendingHalf = null
      } else {
        pendingHalf = field
      }
    } else {
      if (pendingHalf) {
        rows.push([pendingHalf])
        pendingHalf = null
      }
      rows.push([field])
    }
  }
  if (pendingHalf) {
    rows.push([pendingHalf])
  }

  if (submitState === 'success') {
    return (
      <div className={className}>
        <div
          className={
            card
              ? 'border border-muted rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 text-center'
              : 'flex flex-col items-center gap-4 text-center'
          }
        >
          <p className="text-lg font-medium">Thank you!</p>
          <p className="text-foreground-light">
            {successMessage ?? "We've received your submission and will be in touch soon."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {(title || description) && (
        <div className="flex flex-col items-center gap-4 text-center text-balance mb-10">
          {title && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl leading-tight tracking-tight">
              {title}
            </h2>
          )}
          {description && <p className="text-foreground-light text-lg max-w-xl">{description}</p>}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={
          card
            ? 'border border-muted rounded-2xl p-6 sm:p-8 flex flex-col gap-6'
            : 'flex flex-col gap-6'
        }
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={row.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : undefined}
          >
            {row.map((field) => (
              <div key={field.name} className="flex flex-col gap-2">
                <label className="text-sm text-foreground font-medium">{field.label}</label>
                <FormField
                  field={field}
                  value={values[field.name] ?? ''}
                  onChange={(v) => handleChange(field.name, v)}
                />
              </div>
            ))}
          </div>
        ))}

        {submitState === 'error' && errorMessages.length > 0 && (
          <div className="flex flex-col gap-1">
            {errorMessages.map((msg, i) => (
              <p key={i} className="text-sm text-destructive">
                {msg}
              </p>
            ))}
          </div>
        )}

        <hr className="border-muted" />

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={submitState === 'loading'}
        >
          {submitLabel}
        </Button>

        {disclaimer && (
          <div className="text-xs text-foreground-lighter leading-relaxed [&_a]:text-brand-link [&_a]:decoration-brand-link">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p>{children}</p>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {disclaimer}
            </ReactMarkdown>
          </div>
        )}
      </form>
    </div>
  )
}
