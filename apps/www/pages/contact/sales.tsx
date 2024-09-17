import { CircleAlert } from 'lucide-react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import {
  Button,
  ButtonProps,
  cn,
  Input_Shadcn_,
  Label_Shadcn_,
  Separator,
  TextArea_Shadcn_,
} from 'ui'

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
    label: 'Message',
    placeholder: 'Message',
    required: true,
    className: '',
    component: TextArea_Shadcn_,
  },
}

const isValidEmail = (email: string): boolean => {
  // Basic email validation regex
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

const data = {
  meta_title: 'Contact Sales & Request a Demo | Supabase',
  meta_description: 'Book a demo to explore how Supabase can support your business growth',
}

const ContactSales = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    secondName: '',
    companyEmail: '',
    message: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = (): boolean => {
    const newErrors: { [key in keyof FormData]?: string } = {}

    // Check required fields
    for (const key in formConfig) {
      if (formConfig[key as keyof FormData].required && !formData[key as keyof FormData]) {
        newErrors[key as keyof FormData] = `required field`
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
        <div className="">
          <SectionContainer className="space-y-2 text-center max-w-2xl">
            <h1 className="h1">Talk to our Sales team</h1>
            <p className="text-lg text-foreground-lighter">
              Book a demo to explore how Supabase can support your business growth with features and
              plans designed to scale.
            </p>
          </SectionContainer>
        </div>
        <SectionContainer className="text grid gap-8 lg:gap-12 md:grid-cols-2 max-w-6xl !pt-0">
          <div className="md:h-full flex flex-col gap-4">
            <p className="p">lorem</p>
          </div>
          <Panel innerClassName="p-4">
            <form
              id="support-form"
              className={cn('flex flex-col md:grid md:grid-cols-2 gap-4')}
              onSubmit={handleSubmit}
            >
              {Object.entries(formConfig).map(([key, { component: Component, ...fieldValue }]) => {
                const formKey = key as keyof FormData
                const fieldName = formData[formKey as keyof FormData]
                return (
                  <div
                    key={key}
                    className={cn('flex flex-col col-span-full gap-y-2', fieldValue.className)}
                  >
                    <Label_Shadcn_
                      htmlFor={formKey}
                      className="text-foreground-light flex justify-between"
                    >
                      {fieldValue.label}
                      {/* {fieldValue.required && <span className="text-error">*</span>} */}
                      <div
                        className={cn(
                          'flex flex-nowrap gap-1 items-center text-xs leading-none transition-opacity opacity-0 !text-foreground-lighter',
                          errors[key as keyof FormData] && 'opacity-100 animate-flash-code'
                        )}
                      >
                        <CircleAlert className="w-3 h-3" /> {errors[formKey]}
                      </div>
                    </Label_Shadcn_>
                    <Component
                      type="text"
                      id={formKey}
                      name={formKey}
                      value={formData[formKey]}
                      onChange={handleChange}
                      placeholder={fieldValue.placeholder}
                    />
                  </div>
                )
              })}
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
              {errors.general && (
                <div className="text-foreground text-center text-sm col-span-full">
                  {errors.general}
                </div>
              )}
            </form>
          </Panel>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default ContactSales
