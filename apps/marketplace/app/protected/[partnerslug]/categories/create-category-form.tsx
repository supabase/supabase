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

import { createCategoryAction } from '@/app/protected/actions'

const createCategorySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type CreateCategoryValues = z.infer<typeof createCategorySchema>

type CreateCategoryFormProps = {
  partnerSlug: string
}

export function CreateCategoryForm({ partnerSlug }: CreateCategoryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const defaultValues: CreateCategoryValues = {
    title: '',
    description: '',
  }

  const form = useForm<CreateCategoryValues>({
    defaultValues,
  })
  const isDirty = form.formState.isDirty

  const onSubmit = (values: CreateCategoryValues) => {
    const parsed = createCategorySchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string') {
          form.setError(fieldName as keyof CreateCategoryValues, {
            type: 'manual',
            message: issue.message,
          })
        }
      })
      return
    }

    setError(null)

    const formData = new FormData()
    formData.set('partnerSlug', partnerSlug)
    formData.set('title', parsed.data.title)
    formData.set('description', parsed.data.description ?? '')

    startTransition(async () => {
      try {
        await createCategoryAction(formData)
        form.reset(defaultValues)
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unable to create category'
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
                  description="Category label shown in reviewer and marketplace workflows."
                >
                  <FormControl className="col-span-8">
                    <Input id="category-title" required disabled={isPending} {...field} />
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
                  description="Optional details to help reviewers choose this category."
                >
                  <FormControl className="col-span-8">
                    <TextArea
                      id="category-description"
                      rows={4}
                      disabled={isPending}
                      placeholder="Optional category description"
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
            {isDirty ? (
              <Button htmlType="button" type="outline" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
            ) : null}
            <Button htmlType="submit" type="primary" disabled={!isDirty || isPending}>
              {isPending ? 'Saving...' : 'Add category'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
