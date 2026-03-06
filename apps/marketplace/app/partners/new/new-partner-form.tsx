'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  Form_Shadcn_ as Form,
  Input_Shadcn_ as Input,
  TextArea_Shadcn_ as TextArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { createPartnerAction } from '@/app/protected/actions'

const newPartnerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
})

type NewPartnerValues = z.infer<typeof newPartnerSchema>

export function NewPartnerForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fieldsDisabled = isPending

  const form = useForm<NewPartnerValues>({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
    },
  })
  const isDirty = form.formState.isDirty

  const onSubmit = (values: NewPartnerValues) => {
    const parsed = newPartnerSchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string') {
          form.setError(fieldName as keyof NewPartnerValues, {
            type: 'manual',
            message: issue.message,
          })
        }
      })
      return
    }

    setError(null)

    const formData = new FormData()
    formData.set('title', parsed.data.title)
    formData.set('slug', parsed.data.slug?.trim() ?? '')
    formData.set('description', parsed.data.description ?? '')

    startTransition(async () => {
      try {
        await createPartnerAction(formData)
      } catch (submitError) {
        const message =
          submitError instanceof Error ? submitError.message : 'Unable to create partner'
        setError(message)
      }
    })
  }

  const handleCancel = () => {
    form.reset()
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
                    <Input
                      id="partner-title"
                      placeholder="Acme Inc."
                      required
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
              name="slug"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Slug (optional)"
                  description="Leave empty to auto-generate from your title."
                >
                  <FormControl className="col-span-8">
                    <Input id="partner-slug" placeholder="acme-inc" disabled={fieldsDisabled} {...field} />
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
                    <TextArea
                      id="partner-description"
                      rows={4}
                      placeholder="Tell users what your partner account publishes."
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
              <Button type="button" variant="outline" disabled={fieldsDisabled} onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? 'Creating...' : 'Create partner'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
