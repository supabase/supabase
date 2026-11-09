import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import type { ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button, Form, FormControl, FormField, TextArea } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  CSAT_COMMENT_MAX_LENGTH,
  CsatSurveyFormSchema,
  csatSurveyParamsSchema,
  type CsatSurveyFormValues,
} from './CsatSurvey.schema'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { useCsatSurveyMutation } from '@/data/support/csat-survey-mutation'

const PAGE_TITLE = 'Customer Satisfaction Survey'

const withLayout = (children: ReactNode) => (
  <InterstitialLayout logo={<SupabaseLogo />} title={PAGE_TITLE}>
    <div className="px-6 pb-6">{children}</div>
  </InterstitialLayout>
)

export const CsatSurvey = () => {
  const { conversation_id, helpful } = useParams()
  const paramsParsingResult = csatSurveyParamsSchema.safeParse({ conversation_id, helpful })

  if (!paramsParsingResult.success) {
    return withLayout(
      <Admonition type="destructive" title="Error" description="Invalid or mismatched ticket" />
    )
  }

  return (
    <CsatSurveyForm
      conversationId={paramsParsingResult.data.conversation_id}
      initialSatisfied={paramsParsingResult.data.helpful}
    />
  )
}

const CsatSurveyForm = ({
  conversationId,
  initialSatisfied,
}: {
  conversationId: string
  initialSatisfied: boolean
}) => {
  const {
    mutate: submitSurvey,
    isPending,
    isSuccess,
    isError,
    error,
  } = useCsatSurveyMutation({ onError: () => {} })

  const form = useForm<CsatSurveyFormValues>({
    resolver: zodResolver(CsatSurveyFormSchema),
    defaultValues: { satisfied: initialSatisfied, comment: '' },
  })
  const satisfied = useWatch({ control: form.control, name: 'satisfied' })

  const onSubmit = (values: CsatSurveyFormValues) => {
    submitSurvey({
      conversationId,
      satisfied: values.satisfied,
      comment: values.comment || undefined,
    })
  }

  if (isSuccess) {
    return withLayout(
      <Admonition
        type="success"
        title="Success"
        description="Survey response recorded. You can now close this window."
      />
    )
  }

  const isAlreadySubmitted = isError && error.code === 409
  if (isAlreadySubmitted) {
    return withLayout(
      <Admonition
        type="destructive"
        title="Error"
        description="This survey has already been submitted"
      />
    )
  }

  const isTicketMismatch = isError && error.code === 404
  if (isTicketMismatch) {
    return withLayout(
      <Admonition type="destructive" title="Error" description="Invalid or mismatched ticket" />
    )
  }

  return withLayout(
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="satisfied"
          render={({ field }) => (
            <FormItemLayout
              layout="vertical"
              label="Were you satisfied with your Supabase Support Experience?"
            >
              <FormControl>
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Were you satisfied with your Supabase Support Experience?"
                >
                  <Button
                    type="button"
                    variant={satisfied === true ? 'primary' : 'default'}
                    aria-pressed={satisfied === true}
                    onClick={() => field.onChange(true)}
                    block
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={satisfied === false ? 'primary' : 'default'}
                    aria-pressed={satisfied === false}
                    onClick={() => field.onChange(false)}
                    block
                  >
                    No
                  </Button>
                </div>
              </FormControl>
            </FormItemLayout>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItemLayout layout="vertical" label="Would you like to add a comment?">
              <FormControl>
                <TextArea {...field} rows={4} maxLength={CSAT_COMMENT_MAX_LENGTH} />
              </FormControl>
            </FormItemLayout>
          )}
        />
        {isError && <Admonition type="destructive" title="Error" description={error.message} />}
        <Button type="submit" variant="primary" loading={isPending} block>
          Submit
        </Button>
      </form>
    </Form>
  )
}
