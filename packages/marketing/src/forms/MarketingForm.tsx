'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Button,
  Checkbox,
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
import { formCrmConfigSchema, formFieldSchema, type GoFormFieldShowWhen } from '../go/schemas'

/** Input-shape field type — fields with Zod defaults (`half`, `required`) are optional here. */
export type MarketingFormField = z.input<typeof formFieldSchema>
export type MarketingFormCrmConfig = z.input<typeof formCrmConfigSchema>

/**
 * Evaluate a `showWhen` rule against the current form values. All supplied
 * criteria must pass (AND). Missing values are treated as the empty string.
 */
function evaluateShowWhen(showWhen: GoFormFieldShowWhen, values: Record<string, string>): boolean {
  const value = values[showWhen.field] ?? ''
  if (showWhen.equals !== undefined && value !== showWhen.equals) return false
  if (showWhen.notEquals !== undefined && value === showWhen.notEquals) return false
  if (showWhen.in !== undefined && !showWhen.in.includes(value)) return false
  if (showWhen.notIn !== undefined && showWhen.notIn.includes(value)) return false
  if (showWhen.truthy === true && value === '') return false
  if (showWhen.truthy === false && value !== '') return false
  return true
}

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

function FieldInput({
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
    case 'url':
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
    case 'checkbox':
      return null
    default: {
      const _exhaustive: never = field
      return null
    }
  }
}

function Field({
  field,
  value,
  onChange,
}: {
  field: MarketingFormField
  value: string
  onChange: (value: string) => void
}) {
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-3 cursor-pointer text-sm text-foreground-light leading-relaxed">
        <Checkbox
          className="mt-0.5"
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(checked === true ? 'true' : 'false')}
        />
        <span>{field.label}</span>
      </label>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-foreground font-medium">{field.label}</label>
      <FieldInput field={field} value={value} onChange={onChange} />
      {field.description && (
        <p className="text-xs text-foreground-lighter leading-relaxed">{field.description}</p>
      )}
    </div>
  )
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

  // Only fields whose `showWhen` (if any) currently passes are rendered or submitted.
  const visibleFields = fields.filter((f) => !f.showWhen || evaluateShowWhen(f.showWhen, values))
  const visibleFieldNames = new Set(visibleFields.map((f) => f.name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Required checkboxes aren't covered by HTML5 validation; check them manually.
    const uncheckedRequired = visibleFields.filter(
      (f) => f.type === 'checkbox' && f.required && values[f.name] !== 'true'
    )
    if (uncheckedRequired.length > 0) {
      setSubmitState('error')
      setErrorMessages(
        uncheckedRequired.map((f) => `Please confirm: ${f.label.replace(/\*$/, '').trim()}`)
      )
      return
    }

    // Strip values for fields that are currently hidden so stale data doesn't leak.
    const submittedValues = Object.fromEntries(
      Object.entries(values).filter(([name]) => visibleFieldNames.has(name))
    )

    if (!crm) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[marketing/form] No CRM configured — form values:', submittedValues)
      }
      return
    }

    setSubmitState('loading')
    setErrorMessages([])

    const pageUri = typeof window !== 'undefined' ? window.location.href : undefined
    const pageName = typeof document !== 'undefined' ? document.title : undefined

    try {
      const result = await submitFormAction(crm, submittedValues, { pageUri, pageName })

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

  // Group fields into rows: half-width fields pair up, full-width fields get their own row.
  // Checkbox fields always take a full row regardless of their `half` flag.
  const rows: MarketingFormField[][] = []
  let pendingHalf: MarketingFormField | null = null

  for (const field of visibleFields) {
    const isHalf = field.half && field.type !== 'checkbox'
    if (isHalf) {
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
              <Field
                key={field.name}
                field={field}
                value={values[field.name] ?? ''}
                onChange={(v) => handleChange(field.name, v)}
              />
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
