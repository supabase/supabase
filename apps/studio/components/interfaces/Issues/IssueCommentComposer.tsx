import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useForm, useWatch } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormInputGroupTextArea,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { IssueActorAvatar } from './IssueActorAvatar'
import { useIssueViewer } from './useIssueViewer'
import { useIssueCommentCreateMutation } from '@/data/issues/issue-comment-create-mutation'
import { markdownDocument, type Issue } from '@/data/issues/issue-schema'

const formSchema = z.object({ body: z.string().trim().min(1, 'Write a comment') })
const defaultValues = { body: '' }

export const IssueCommentComposer = ({ issue }: { issue: Issue }) => {
  const { ref } = useParams()
  const viewer = useIssueViewer()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const body = useWatch({ control: form.control, name: 'body' })
  const { mutate: createComment, isPending } = useIssueCommentCreateMutation({
    onSuccess: () => form.reset(defaultValues),
  })

  return (
    <div className="relative pl-9">
      {/* Sits on the timeline, lined up with the textarea's first line. Its card background
          covers the rest of the line so the timeline ends at the avatar. */}
      <div className="absolute bottom-0 left-0 top-2 bg-card">
        {viewer ? (
          <IssueActorAvatar actor={viewer} />
        ) : (
          <span aria-hidden className="block size-6 rounded-full bg-secondary" />
        )}
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(({ body }) => {
            if (!ref) return
            createComment({ projectRef: ref, id: issue.id, body: markdownDocument(body) })
          })}
        >
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItemLayout name="body" layout="vertical">
                <FormControl>
                  <InputGroup>
                    <FormInputGroupTextArea
                      {...field}
                      aria-label="Comment"
                      placeholder="Leave a comment. Mention @Assistant to ask for help."
                      rows={3}
                      readOnly={isPending}
                    />
                    <InputGroupAddon align="block-end" className="justify-end">
                      <InputGroupButton
                        type="submit"
                        variant="default"
                        disabled={!body.trim() || isPending}
                        loading={isPending}
                      >
                        Comment
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
              </FormItemLayout>
            )}
          />
        </form>
      </Form>
    </div>
  )
}
