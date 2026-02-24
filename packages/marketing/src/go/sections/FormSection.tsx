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

import { submitFormAction } from '../actions/submitForm'
import type { GoFormField, GoFormSection } from '../schemas'

function FormField({
  field,
  value,
  onChange,
}: {
  field: GoFormField
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

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export default function FormSection({ section }: { section: GoFormSection }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(section.fields.map((f) => [f.name, '']))
  )
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!section.crm) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[go/form] No CRM configured — form values:', values)
      }
      return
    }

    setSubmitState('loading')
    setErrorMessages([])

    const pageUri = typeof window !== 'undefined' ? window.location.href : undefined
    const pageName = typeof document !== 'undefined' ? document.title : undefined

    try {
      const result = await submitFormAction(section.crm, values, { pageUri, pageName })

      if (result.success) {
        if (section.successRedirect) {
          window.location.href = section.successRedirect
        } else {
          setSubmitState('success')
        }
      } else {
        setSubmitState('error')
        setErrorMessages(result.errors)
      }
    } catch (err: any) {
      // Unexpected client-side error (network failure, server action crash, etc.)
      console.error('[go/form] Form submission failed:', err)
      setSubmitState('error')
      setErrorMessages(['Something went wrong. Please try again.'])
    }
  }

  // Group fields into rows: half-width fields pair up, full-width fields get their own row
  const rows: GoFormField[][] = []
  let pendingHalf: GoFormField | null = null

  for (const field of section.fields) {
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
      <section>
        <div className="max-w-2xl mx-auto px-8">
          <div className="border border-muted rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-medium">Thank you!</p>
            <p className="text-foreground-light">
              {section.successMessage ??
                "We've received your submission and will be in touch soon."}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="max-w-2xl mx-auto px-8">
        {(section.title || section.description) && (
          <div className="flex flex-col items-center gap-4 text-center text-balance mb-10">
            {section.title && (
              <h2 className="text-2xl md:text-3xl lg:text-4xl leading-tight tracking-tight">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-foreground-light text-lg max-w-xl">{section.description}</p>
            )}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="border border-muted rounded-2xl p-6 sm:p-8 flex flex-col gap-6"
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
            {section.submitLabel}
          </Button>

          {section.disclaimer && (
            <div className="text-xs text-foreground-lighter leading-relaxed [&_a]:text-brand-link [&_a]:decoration-brand-link">
              <ReactMarkdown
                components={{ p: ({ children }) => <p>{children}</p>, a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}
              >
                {section.disclaimer}
              </ReactMarkdown>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
