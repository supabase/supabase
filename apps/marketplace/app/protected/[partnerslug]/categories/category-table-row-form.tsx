'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_ as Form,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  Input_Shadcn_ as Input,
  TableCell,
  TableRow,
  TextArea_Shadcn_ as TextArea,
} from 'ui'
import { z } from 'zod'

import { updateCategoryAction } from '@/app/protected/actions'

const updateCategorySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type UpdateCategoryValues = z.infer<typeof updateCategorySchema>

type CategoryTableRowFormProps = {
  partnerSlug: string
  category: {
    id: number
    title: string
    description: string | null
  }
  itemCount: number
}

export function CategoryTableRowForm({ partnerSlug, category, itemCount }: CategoryTableRowFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const defaultValues: UpdateCategoryValues = {
    title: category.title,
    description: category.description ?? '',
  }
  const form = useForm<UpdateCategoryValues>({
    defaultValues,
  })
  const isDirty = form.formState.isDirty

  const onSubmit = (values: UpdateCategoryValues) => {
    const parsed = updateCategorySchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string') {
          form.setError(fieldName as keyof UpdateCategoryValues, {
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
    formData.set('categoryId', String(category.id))
    formData.set('title', parsed.data.title)
    formData.set('description', parsed.data.description ?? '')

    startTransition(async () => {
      try {
        await updateCategoryAction(formData)
        form.reset(parsed.data)
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unable to save category'
        setError(message)
      }
    })
  }

  return (
    <Form {...form}>
      <TableRow>
        <TableCell className="align-top">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormControl>
                <Input required disabled={isPending} {...field} />
              </FormControl>
            )}
          />
        </TableCell>
        <TableCell className="align-top">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormControl>
                <TextArea
                  rows={2}
                  disabled={isPending}
                  placeholder="Optional description for this category"
                  {...field}
                />
              </FormControl>
            )}
          />
        </TableCell>
        <TableCell className="align-top text-muted-foreground">{itemCount}</TableCell>
        <TableCell className="text-right align-top">
          <div className="flex flex-col items-end gap-2">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex gap-2">
                {isDirty ? (
                  <Button
                    htmlType="button"
                    type="outline"
                    size="small"
                    disabled={isPending}
                    onClick={() => {
                      form.reset(defaultValues)
                      setError(null)
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button htmlType="submit" type="default" size="small" disabled={!isDirty || isPending}>
                  {isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        </TableCell>
      </TableRow>
    </Form>
  )
}
