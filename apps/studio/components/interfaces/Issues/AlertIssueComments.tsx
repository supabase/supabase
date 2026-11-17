import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField, Textarea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import {
  ASSISTANT_AUTHOR,
  mentionsAssistant,
  splitAssistantMentions,
} from './AlertIssueAssistant.utils'
import { useAlertIssueAssistant } from './AlertIssueAssistantProvider'
import {
  AlertIssueAssistantRun,
  ASSISTANT_MARKDOWN_CLASS_NAME,
  AssistantAuthor,
} from './AlertIssueAssistantRun'
import { useAlertIssuesOutOfScope } from './useAlertIssuesOutOfScope'
import { Markdown } from '@/components/interfaces/Markdown'
import { AlertError } from '@/components/ui/AlertError'
import { useAlertIssueCommentCreateMutation } from '@/data/alert-issues/alert-issue-comment-create-mutation'
import { alertIssueCommentsQueryOptions } from '@/data/alert-issues/alert-issue-comments-query'
import type { AlertIssueComment } from '@/data/alert-issues/alert-issue.schema'

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

const CommentItem = ({
  comment,
  isMentionHighlighted,
}: {
  comment: AlertIssueComment
  isMentionHighlighted: boolean
}) => {
  const timestamp = dayjs(comment.created_at).fromNow()
  if (comment.author === ASSISTANT_AUTHOR) {
    return (
      <li className="flex flex-col gap-2 rounded-md border border-default bg-surface-100 p-3">
        <AssistantAuthor timestamp={timestamp} />
        <Markdown content={comment.body} className={ASSISTANT_MARKDOWN_CLASS_NAME} />
      </li>
    )
  }
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-foreground-lighter">
        <span className="text-foreground-light">{comment.author}</span>
        <span>{timestamp}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">
        {!isMentionHighlighted && <span>{comment.body}</span>}
        {isMentionHighlighted &&
          splitAssistantMentions(comment.body).map((part, index) =>
            part.isMention ? (
              <span key={index} className="rounded bg-brand-300 px-1 text-brand-600">
                {part.text}
              </span>
            ) : (
              <span key={index}>{part.text}</span>
            )
          )}
      </p>
    </li>
  )
}

export const AlertIssueComments = ({ projectRef, alertIssueId }: AlertIssueCommentsProps) => {
  const { data, error, isPending, isError } = useQuery(
    alertIssueCommentsQueryOptions({ projectRef, alertIssueId })
  )
  const { mutate, isPending: isSaving } = useAlertIssueCommentCreateMutation()
  const assistantContext = useAlertIssueAssistant()
  const { isOutOfScopeVisible } = useAlertIssuesOutOfScope()
  const assistant = isOutOfScopeVisible ? assistantContext : null
  const comments = isOutOfScopeVisible
    ? data
    : data?.filter((comment) => comment.author !== ASSISTANT_AUTHOR)
  const hasThread = (comments?.length ?? 0) > 0 || !!assistant?.run

  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })
  const { isDirty } = form.formState

  const onSubmit = ({ body }: FormValues) => {
    const prepared =
      assistant && !assistant.isBusy && mentionsAssistant(body)
        ? assistant.prepare({ kind: 'issue', label: 'this alert issue' })
        : undefined
    mutate(
      { projectRef, alertIssueId, body },
      {
        onSuccess: () => {
          form.reset(defaultValues)
          if (prepared) assistant?.start(prepared)
        },
      }
    )
  }

  return (
    <section aria-label="Comments" className="flex flex-col gap-3">
      <h2 className="text-sm text-foreground">Comments</h2>
      {isPending && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve comments" />}
      {data && !hasThread && <p className="text-sm text-foreground-lighter">No comments yet</p>}
      {hasThread && (
        <ol className="flex flex-col gap-3">
          {comments?.map((comment) => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              isMentionHighlighted={isOutOfScopeVisible}
            />
          ))}
          {assistant?.run && <AlertIssueAssistantRun run={assistant.run} />}
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
                    placeholder={
                      isOutOfScopeVisible ? 'Add a comment, or mention @assistant' : 'Add a comment'
                    }
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
