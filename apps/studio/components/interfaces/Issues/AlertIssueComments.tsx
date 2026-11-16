import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField, Textarea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { AlertError } from '@/components/ui/AlertError'
import { useAlertIssueCommentCreateMutation } from '@/data/alert-issues/alert-issue-comment-create-mutation'
import { alertIssueCommentsQueryOptions } from '@/data/alert-issues/alert-issue-comments-query'

const FormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a comment first')
    .max(5000, 'Keep comments under 5,000 characters'),
})
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = { body: '' }

type AlertIssueCommentsProps = { projectRef: string; alertIssueId: string }

export const AlertIssueComments = ({ projectRef, alertIssueId }: AlertIssueCommentsProps) => {
  const { data, error, isPending, isError } = useQuery(
    alertIssueCommentsQueryOptions({ projectRef, alertIssueId })
  )
  const { mutate, isPending: isSaving } = useAlertIssueCommentCreateMutation()

  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })
  const { isDirty } = form.formState

  const onSubmit = ({ body }: FormValues) => {
    mutate({ projectRef, alertIssueId, body }, { onSuccess: () => form.reset(defaultValues) })
  }

  return (
    <section aria-label="Comments" className="flex flex-col gap-3">
      <h2 className="text-sm text-foreground">Comments</h2>
      {isPending ? (
        <GenericSkeletonLoader />
      ) : isError ? (
        <AlertError error={error} subject="Failed to retrieve comments" />
      ) : data.length === 0 ? (
        <p className="text-sm text-foreground-lighter">No comments yet</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {data.map((comment) => (
            <li key={comment.comment_id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-foreground-lighter">
                <span className="text-foreground-light">{comment.author}</span>
                <span>{dayjs(comment.created_at).fromNow()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
            </li>
          ))}
        </ol>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItemLayout>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="Add a comment"
                    aria-label="Add a comment"
                  />
                </FormControl>
              </FormItemLayout>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="default"
              size="tiny"
              disabled={!isDirty}
              loading={isSaving}
            >
              Comment
            </Button>
          </div>
        </form>
      </Form>
    </section>
  )
}
