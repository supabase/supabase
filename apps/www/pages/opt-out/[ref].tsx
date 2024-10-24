import { zodResolver } from '@hookform/resolvers/zod'
import Layout from 'components/Layouts/Default'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  cn,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

const formSchema = z.object({
  ref: z.string(),
  reason: z.string().optional(),
})

export default function OptOutPage() {
  const router = useRouter()
  const ref = router.query.ref as string
  const email = router.query.email as string | undefined

  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [submissionType, setSubmissionType] = useState<'success' | 'error' | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ref: ref,
      reason: undefined,
    },
  })

  const { register } = form

  // Ensure ref is a string
  const refString = typeof ref !== 'string'
  const refPattern = /^[a-zA-Z]{20}$/
  const refIsInvalid = !refString && !refPattern.test(ref)
  const SelectItemContainerClasses = 'flex flex-col text-sm items-start'

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmissionType(null)
      setFormMessage('Submitting...')

      const response = await fetch(`/api-v2/opt-out/${data.ref}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: data.reason, email: email }),
      })
      const message = await response.text()

      if (refIsInvalid) {
        setFormMessage('Error: Invalid project reference.')
        setSubmissionType('error')
      } else if (response.ok) {
        setFormMessage(message)
        setSubmissionType('success')
      } else {
        console.error('Form submission failed:', message)
        setFormMessage('Error: Form submission failed.')
        setSubmissionType('error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setFormMessage('Error: An unexpected error occurred.')
      setSubmissionType('error')
    }
  }

  function OptOutLayout({ children }: { children: React.ReactNode }) {
    return (
      <>
        <NextSeo title="Supabase | Opt Out" description="Opt out of receiving emails." />
        <Layout className="overflow-visible mx-auto max-w-xl mt-24 flex flex-col gap-8">
          {children}
        </Layout>
      </>
    )
  }

  useEffect(() => {
    form.reset({ ref: ref, reason: '' })
  }, [ref])

  return (
    <>
      <OptOutLayout>
        <div>
          <span className="label">Opt out</span>
          <h2 className="h4 !m-0">Receive an unexpected email from Supabase?</h2>
          <p className="text-foreground-light">Please report it here so we can investigate.</p>
        </div>

        {refIsInvalid && (
          <Admonition type="warning" title="Invalid project reference">
            <p>The project reference you entered is invalid.</p>
            <p>Please check the URL and try again.</p>
          </Admonition>
        )}

        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="gap-4 max-w-xs flex flex-col">
            <input hidden value={form.getValues('ref')} readOnly {...register('ref')} />
            <FormField_Shadcn_
              name="reason"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout label="Choose reason for reporting" labelOptional="Optional">
                  <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger_Shadcn_ size="medium">
                      <SelectValue_Shadcn_ placeholder="Select a reason (optional)">
                        {field.value}
                      </SelectValue_Shadcn_>
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        <SelectItem_Shadcn_ value="phishing">
                          <div className={SelectItemContainerClasses}>
                            <span>Phishing</span>
                            <span className="text-foreground-light text-xs">
                              Attempt to obtain sensitive information
                            </span>
                          </div>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="advertisement">
                          <div className={SelectItemContainerClasses}>
                            <span>Advertisement</span>
                            <span className="text-foreground-light text-xs">
                              Unwanted promotional content
                            </span>
                          </div>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="malware">
                          <div className={SelectItemContainerClasses}>
                            <span>Malware</span>
                            <span className="text-foreground-light text-xs">
                              Contains harmful software
                            </span>
                          </div>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="scam">
                          <div className={SelectItemContainerClasses}>
                            <span>Scam</span>
                            <span className="text-foreground-light text-xs">
                              Fraudulent or deceptive content
                            </span>
                          </div>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="other">
                          <div className={SelectItemContainerClasses}>
                            <span>Other</span>
                            <span className="text-foreground-light text-xs">
                              Any other type of spam
                            </span>
                          </div>
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormItemLayout>
              )}
            />
            <Button htmlType="submit" size="small" disabled={submissionType === 'success'}>
              Report spam
            </Button>
            <FormMessage_Shadcn_
              className={cn(
                'border-l pl-3',
                submissionType === 'error'
                  ? 'border-destructive'
                  : 'border-foreground-muted text-foreground'
              )}
            >
              {formMessage}
            </FormMessage_Shadcn_>
          </form>
        </Form_Shadcn_>
      </OptOutLayout>
    </>
  )
}
