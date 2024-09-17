import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { CircleAlert } from 'lucide-react'
import { Button, cn, Input_Shadcn_, Label_Shadcn_, Separator, TextArea_Shadcn_ } from 'ui'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'

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

const formConfig: FormConfig = {
  firstName: {
    type: 'text',
    label: 'First Name',
    placeholder: 'First Name',
    required: true,
    className: 'md:col-span-1',
    component: Input_Shadcn_,
  },
  secondName: {
    type: 'text',
    label: 'Last Name',
    placeholder: 'Last Name',
    required: true,
    className: 'md:col-span-1',
    component: Input_Shadcn_,
  },
  companyEmail: {
    type: 'text',
    label: 'Company Email',
    placeholder: 'Company Email',
    required: true,
    className: '',
    component: Input_Shadcn_,
  },
  message: {
    type: 'textarea',
    label: 'What are you interested in?',
    placeholder: 'Share more about what you want to accomplish',
    required: true,
    className: '[&_textarea]:min-h-[100px] [&_textarea]:bg-foreground/[.026]',
    component: TextArea_Shadcn_,
  },
}

const isValidEmail = (email: string): boolean => {
  // Basic email validation regex
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

const data = {
  meta_title: 'Contact Sales & Request a Demo | Supabase',
  meta_description: 'Book a demo to explore how Supabase can support your business growth',
}

const defaultFormValue: FormData = {
  firstName: '',
  secondName: '',
  companyEmail: '',
  message: '',
}

const ContactSales = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(defaultFormValue)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

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
        newErrors[key as keyof FormData] = `This field is required`
      }
    }

    // Validate email
    if (formData.companyEmail && !isValidEmail(formData.companyEmail)) {
      newErrors.companyEmail = 'Invalid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setSuccess(null)

    try {
      const response = await fetch('/api/contact-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess('Thank you for your submission!')
        setFormData({ firstName: '', secondName: '', companyEmail: '', message: '' })
      } else {
        const errorData = await response.json()
        setErrors({ general: `Submission failed: ${errorData.message}` })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <NextSeo
        title={data.meta_title}
        description={data.meta_description}
        openGraph={{
          title: data.meta_title,
          description: data.meta_description,
          url: `https://supabase.com/${router.pathname}`,
        }}
      />
      <DefaultLayout className="!min-h-fit">
        <SectionContainer className="text grid gap-8 lg:gap-12 md:grid-cols-2 md:max-w-6xl">
          <div className="md:px-4 md:h-full w-full md:max-w-md flex flex-col justify-between gap-2">
            <div className="flex flex-col gap-2">
              <h1 className="h1">Talk to our Sales team</h1>
              <p className="md:text-lg text-foreground-lighter">
                Book a demo to explore how Supabase can support your business growth with features
                and plans designed to scale.
              </p>
            </div>
            <div className="md:pb-8">Quotes here...</div>
          </div>
          <div className="flex flex-col gap-4 w-full items-center justify-center min-h-[300px]">
            <Panel innerClassName="p-4 md:p-6 w-full md:max-w-lg min-h-[300px]">
              {success ? (
                <div className="flex flex-col h-full w-full min-w-[300px] gap-2 items-center justify-center opacity-0 transition-opacity animate-fade-in scale-1">
                  <p className="text-center">{success}</p>
                  <Button onClick={handleReset}>Reset form</Button>
                </div>
              ) : (
                <form
                  id="support-form"
                  className={cn('flex flex-col lg:grid lg:grid-cols-2 gap-4')}
                  onSubmit={handleSubmit}
                >
                  {Object.entries(formConfig).map(
                    ([key, { component: Component, ...fieldValue }]) => {
                      const fieldKey = key as keyof FormData

                      return (
                        <div
                          key={key}
                          className={cn(
                            'flex flex-col col-span-full gap-y-2',
                            fieldValue.className
                          )}
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
                    }
                  )}
                  <Separator className="col-span-full" />
                  <Button
                    block
                    htmlType="submit"
                    size="small"
                    className="col-span-full"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                  >
                    Request a demo
                  </Button>
                  <p className="text-foreground-lighter text-sm col-span-full">
                    By submitting this form, I confirm that I have read and understood the{' '}
                    <Link href="/privacy" className="text-foreground hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                  {errors.general && (
                    <div className="text-foreground text-center text-sm col-span-full">
                      <CircleAlert className="w-3 h-3" /> {errors.general}
                    </div>
                  )}
                </form>
              )}
            </Panel>
            <p className="text-foreground-lighter text-sm">
              <Link href="/support" className="text-foreground hover:underline">
                Contact support
              </Link>{' '}
              if you need technical help.
            </p>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default ContactSales
