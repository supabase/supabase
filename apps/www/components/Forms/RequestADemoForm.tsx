import { FC, useEffect, useState } from 'react'
import Link from 'next/link'
import { CircleAlert } from 'lucide-react'
import { Button, cn, Input_Shadcn_, Label_Shadcn_, Separator, TextArea_Shadcn_ } from 'ui'
import { Alert } from 'ui/src/components/shadcn/ui/alert'
import { useReverseNameOrder, useT } from '~/lib/intl'
import { useIntl } from 'react-intl'

interface FormData {
  firstName: string
  secondName: string
  companyEmail: string
  message: string
}

interface FormItem {
  type: 'text' | 'textarea'
  label: string
  placeholder: string
  required: boolean
  className?: string
  component: typeof TextArea_Shadcn_ | typeof Input_Shadcn_
}

type FormConfig = {
  [K in keyof FormData]: FormItem
}

interface Props {
  className?: string
}

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

const personalEmailDomains = [
  '@gmail.com',
  '@yahoo.com',
  '@hotmail.',
  '@outlook.com',
  '@aol.com',
  '@icloud.com',
  '@live.com',
  '@protonmail.com',
  '@mail.com',
  '@example.com',
]

const isCompanyEmail = (email: string): boolean => {
  for (const domain of personalEmailDomains) {
    if (email.includes(domain)) {
      return false
    }
  }

  return true
}

const defaultFormValue: FormData = {
  firstName: '',
  secondName: '',
  companyEmail: '',
  message: '',
}

const RequestADemoForm: FC<Props> = ({ className }) => {
  const [formData, setFormData] = useState<FormData>(defaultFormValue)
  const [honeypot, setHoneypot] = useState<string>('') // field to prevent spam
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  const intl = useIntl()
  const t = useT()

  const firstName: FormItem = {
    type: 'text',
    label: t('forms.demo.firstName.label'),
    placeholder: t('forms.demo.firstName.placeholder'),
    required: true,
    className: 'md:col-span-1',
    component: Input_Shadcn_,
  }
  const secondName: FormItem = {
    type: 'text',
    label: t('forms.demo.secondName.label'),
    placeholder: t('forms.demo.secondName.placeholder'),
    required: true,
    className: 'md:col-span-1',
    component: Input_Shadcn_,
  }

  const orderedNameInputs = useReverseNameOrder()
    ? { secondName, firstName }
    : { firstName, secondName }

  const formConfig: FormConfig = {
    ...orderedNameInputs,
    companyEmail: {
      type: 'text',
      label: t('forms.demo.companyEmail.label'),
      placeholder: t('forms.demo.companyEmail.placeholder'),
      required: true,
      className: '',
      component: Input_Shadcn_,
    },
    message: {
      type: 'textarea',
      label: t('forms.demo.message.label'),
      placeholder: t('forms.demo.message.placeholder'),
      required: true,
      className: '[&_textarea]:min-h-[100px] [&_textarea]:bg-foreground/[.026]',
      component: TextArea_Shadcn_,
    },
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setErrors({})
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault()
    setFormData(defaultFormValue)
    setSuccess(null)
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: { [key in keyof FormData]?: string } = {}

    // Check required fields
    for (const key in formConfig) {
      if (formConfig[key as keyof FormData].required && !formData[key as keyof FormData]) {
        newErrors[key as keyof FormData] = t('forms.demo.errors.required')
      }
    }

    // Validate email
    if (formData.companyEmail && !isValidEmail(formData.companyEmail)) {
      newErrors.companyEmail = t('forms.demo.errors.invalidEmail')
    }

    // Validate company email
    if (formData.companyEmail && !isCompanyEmail(formData.companyEmail)) {
      newErrors.companyEmail = t('forms.demo.errors.companyEmail')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 && honeypot === ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const currentTime = Date.now()
    const timeElapsed = (currentTime - startTime) / 1000

    if (timeElapsed < 3) {
      setErrors({ general: t('forms.demo.errors.tooFast') })
      return
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setSuccess(null)

    try {
      const response = await fetch('/api-v2/submit-form-contact-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(t('forms.demo.success'))
        setFormData({ firstName: '', secondName: '', companyEmail: '', message: '' })
      } else {
        const errorData = await response.json()
        setErrors({ general: `Submission failed: ${errorData.message}` })
      }
    } catch (error) {
      setErrors({ general: t('forms.demo.errors.unexpected') })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    setStartTime(Date.now())
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col gap-4 w-full items-center justify-center min-h-[300px]',
        className
      )}
    >
      <div className="border rounded-xl bg-surface-75 p-4 md:p-6 w-full lg:max-w-lg min-h-[200px] md:min-h-[400px]">
        {success ? (
          <div className="flex flex-col h-full w-full min-w-[300px] gap-4 items-center justify-center opacity-0 transition-opacity animate-fade-in scale-1">
            <p className="text-center text-sm">{success}</p>
            <Button onClick={handleReset}>{t('forms.demo.reset')}</Button>
          </div>
        ) : (
          <form
            id="support-form"
            className={cn('flex flex-col lg:grid lg:grid-cols-2 gap-4')}
            onSubmit={handleSubmit}
          >
            {Object.entries(formConfig).map(([key, { component: Component, ...fieldValue }]) => {
              const fieldKey = key as keyof FormData

              return (
                <div
                  key={key}
                  className={cn('flex flex-col col-span-full gap-y-2', fieldValue.className)}
                >
                  <Label_Shadcn_
                    htmlFor={fieldKey}
                    className="text-foreground-light flex justify-between"
                  >
                    {fieldValue.label}
                    <div
                      className={cn(
                        'flex flex-nowrap text-right gap-1 items-center text-xs leading-none transition-opacity opacity-0 text-foreground-muted',
                        errors[key as keyof FormData] && 'opacity-100 animate-fade-in'
                      )}
                    >
                      {errors[fieldKey]}
                    </div>
                  </Label_Shadcn_>
                  <Component
                    type="text"
                    id={fieldKey}
                    name={fieldKey}
                    value={formData[fieldKey]}
                    onChange={handleChange}
                    placeholder={fieldValue.placeholder}
                  />
                </div>
              )
            })}

            {/* Spam prevention */}
            <input
              type="text"
              name="honeypot"
              value={honeypot}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value)}
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            <Separator className="col-span-full" />
            <Button
              block
              htmlType="submit"
              size="small"
              className="col-span-full"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {t('forms.demo.submit')}
            </Button>
            <p className="text-foreground-lighter text-sm col-span-full">
              {intl.formatMessage(
                { id: 'forms.demo.privacy' },
                {
                  privacyPolicyLink: (
                    <Link href="/privacy" className="text-foreground hover:underline">
                      {t('forms.demo.privacy.link')}
                    </Link>
                  ),
                }
              )}
            </p>
            {errors.general && (
              <Alert className="flex gap-2 text-foreground text-sm col-span-full">
                <CircleAlert className="w-3 h-3" /> <span>{errors.general}</span>
              </Alert>
            )}
          </form>
        )}
      </div>
      <p className="text-foreground-lighter text-sm">
        <Link href="/support" className="text-foreground hover:underline">
          {t('forms.demo.support')}
        </Link>{' '}
        {t('forms.demo.support.suffix')}
      </p>
    </div>
  )
}

export default RequestADemoForm
