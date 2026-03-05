'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_ as Form,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  Switch,
  TextArea_Shadcn_ as TextArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { saveItemReviewAction } from '@/app/protected/actions'
import { buildReviewDecisionFormData } from '@/lib/marketplace/review-form'

const reviewStatusEnum = z.enum(['pending_review', 'approved', 'rejected', 'draft'])

const reviewFormSchema = z.object({
  status: reviewStatusEnum,
  featured: z.boolean(),
  reviewNotes: z.string().optional(),
})

type ReviewFormValues = z.infer<typeof reviewFormSchema>

type ReviewDecisionFormProps = {
  partnerSlug: string
  itemId: number
  defaultValues: {
    status: z.infer<typeof reviewStatusEnum>
    featured: boolean
    reviewNotes: string
  }
}

export function ReviewDecisionForm({
  partnerSlug,
  itemId,
  defaultValues,
}: ReviewDecisionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<ReviewFormValues>({
    defaultValues,
  })
  const isDirty = form.formState.isDirty

  const onSubmit = (values: ReviewFormValues) => {
    const parsed = reviewFormSchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string') {
          form.setError(fieldName as keyof ReviewFormValues, {
            type: 'manual',
            message: issue.message,
          })
        }
      })
      return
    }

    setError(null)
    setSuccess(null)

    const formData = buildReviewDecisionFormData({
      partnerSlug,
      itemId,
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes,
      featured: parsed.data.featured,
    })

    startTransition(async () => {
      try {
        await saveItemReviewAction(formData)
        setSuccess('Review decision saved.')
        form.reset(parsed.data)
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unable to save review'
        setError(message)
      }
    })
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    setError(null)
    setSuccess(null)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full h-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Status"
                    description="Set the current review state for this listing."
                  >
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <SelectTrigger id="review-status">
                          <SelectValue placeholder="Select review status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_review">Pending review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Featured"
                    description="Featured items can appear in highlighted marketplace placements."
                  >
                    <FormControl className="col-span-8">
                      <Switch
                        id="review-featured"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="reviewNotes"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Review notes"
                    description="Share reviewer feedback with the submitter."
                  >
                    <FormControl>
                      <TextArea
                        id="review-notes"
                        rows={8}
                        placeholder="Write reviewer notes for the submitter."
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            {error ? (
              <div className="p-6 pt-0">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : null}
            {success ? (
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground">{success}</p>
              </div>
            ) : null}
          </div>
          <div className="shrink-0 border-t py-4 px-6">
            <div className="flex justify-end gap-3">
              {isDirty ? (
                <Button htmlType="button" type="outline" disabled={isPending} onClick={handleCancel}>
                  Cancel
                </Button>
              ) : null}
              <Button type="primary" htmlType="submit" disabled={!isDirty || isPending}>
                {isPending ? 'Sending...' : 'Send review'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
