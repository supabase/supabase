'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_ as Form,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  Input_Shadcn_ as Input,
  TextArea_Shadcn_ as TextArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { updatePartnerAction } from '@/app/protected/actions'

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const optionalUrlSchema = z
  .string()
  .trim()
  .refine((value) => !value || isValidUrl(value), 'Enter a valid URL')

const partnerDetailsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  website: optionalUrlSchema.optional(),
  logoUrl: optionalUrlSchema.optional(),
})

type PartnerDetailsValues = z.infer<typeof partnerDetailsSchema>

type PartnerDetailsFormProps = {
  partnerId: number
  partnerSlug: string
  defaultValues: {
    title: string
    description: string
    website: string
    logoUrl: string
  }
}

export function PartnerDetailsForm({ partnerId, partnerSlug, defaultValues }: PartnerDetailsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fieldsDisabled = isPending

  const form = useForm<PartnerDetailsValues>({
    defaultValues,
  })
  const isDirty = form.formState.isDirty

  const onSubmit = (values: PartnerDetailsValues) => {
    const parsed = partnerDetailsSchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string') {
          form.setError(fieldName as keyof PartnerDetailsValues, {
            type: 'manual',
            message: issue.message,
          })
        }
      })
      return
    }

    setError(null)

    const formData = new FormData()
    formData.set('partnerId', String(partnerId))
    formData.set('partnerSlug', partnerSlug)
    formData.set('title', parsed.data.title)
    formData.set('description', parsed.data.description ?? '')
    formData.set('website', parsed.data.website ?? '')
    formData.set('logoUrl', parsed.data.logoUrl ?? '')

    startTransition(async () => {
      try {
        await updatePartnerAction(formData)
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unable to save partner details'
        setError(message)
      }
    })
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    setError(null)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <Card>
          <CardContent>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Title"
                  description="The name customers see in the marketplace."
                >
                  <FormControl className="col-span-8">
                    <Input id="partner-title" required disabled={fieldsDisabled} {...field} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>

          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Description"
                  description="Tell users what your partner account publishes."
                >
                  <FormControl className="col-span-8">
                    <TextArea id="partner-description" rows={4} disabled={fieldsDisabled} {...field} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>

          <CardContent>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Website"
                  description="Optional canonical website for your partner profile."
                >
                  <FormControl className="col-span-8">
                    <Input
                      id="partner-website"
                      type="url"
                      placeholder="https://example.com"
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>

          <CardContent>
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Logo URL"
                  description="Optional logo image URL shown in partner listings."
                >
                  <FormControl className="col-span-8">
                    <Input
                      id="partner-logo-url"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>

          {error ? (
            <CardContent>
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          ) : null}

          <CardFooter className="justify-end gap-3">
            {isDirty && (
              <Button type="button" variant="outline" onClick={handleCancel} disabled={fieldsDisabled}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? 'Saving...' : 'Save partner details'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
