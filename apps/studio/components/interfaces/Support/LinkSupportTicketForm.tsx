import { zodResolver } from '@hookform/resolvers/zod'
import { useLinkSupportTicketMutation } from 'data/feedback/link-support-ticket-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { Link2 } from 'lucide-react'
import { useEffect } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  DialogSectionSeparator,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CategoryAndSeverityInfo } from './CategoryAndSeverityInfo'
import {
  LinkSupportTicketFormSchema,
  type LinkSupportTicketFormValues,
} from './LinkSupportTicketForm.schema'
import { OrganizationSelector } from './OrganizationSelector'
import { ProjectAndPlanInfo } from './ProjectAndPlanInfo'
import { DISABLE_SUPPORT_ACCESS_CATEGORIES, SupportAccessToggle } from './SupportAccessToggle'
import { NO_ORG_MARKER, NO_PROJECT_MARKER, getOrgSubscriptionPlan } from './SupportForm.utils'

interface LinkSupportTicketFormProps {
  conversationId: string
  onSuccess: () => void
}

// [Joshen] Am reusing the SupportFormV2 components here but am not sure how to type things properly
// hence marking all the `form` as `any` when passing as props to the components for now

export const LinkSupportTicketForm = ({
  conversationId,
  onSuccess,
}: LinkSupportTicketFormProps) => {
  const { data: organizations, isSuccess } = useOrganizationsQuery()

  const form = useForm<LinkSupportTicketFormValues>({
    resolver: zodResolver(LinkSupportTicketFormSchema),
    defaultValues: {
      conversation_id: conversationId,
      organizationSlug: NO_ORG_MARKER,
      projectRef: NO_PROJECT_MARKER,
      category: '' as any,
      allowSupportAccess: true,
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const { category, organizationSlug, projectRef } = form.watch()
  const selectedOrgSlug = organizationSlug === NO_ORG_MARKER ? null : organizationSlug
  const selectedProjectRef = projectRef === NO_PROJECT_MARKER ? null : projectRef
  const subscriptionPlanId = getOrgSubscriptionPlan(organizations, selectedOrgSlug)

  const { mutate: linkSupportTicket, isPending } = useLinkSupportTicketMutation({
    onSuccess: () => {
      toast.success('Support ticket linked successfully!')
      onSuccess()
    },
    onError: (error) => {
      let errorMessage = error.message
      try {
        const parsed = JSON.parse(error.message)
        errorMessage = parsed?._error?.message || parsed?.message || error.message
      } catch {}
      // If parsing fails, use the original message
      toast.error(`Failed to link support ticket: ${errorMessage}`)
    },
  })

  const onSubmit: SubmitHandler<LinkSupportTicketFormValues> = (values) => {
    if (!organizations) return toast.error('Organizations not loaded. Please try again.')

    const selectedOrg = organizations.find((org) => org.slug === values.organizationSlug)
    if (!selectedOrg) return toast.error('Selected organization not found. Please try again.')

    linkSupportTicket({
      conversation_id: values.conversation_id,
      org_id: selectedOrg.id,
      project_ref:
        values.projectRef && values.projectRef !== NO_PROJECT_MARKER
          ? values.projectRef
          : undefined,
      category: values.category,
      allow_support_access:
        values.category && !DISABLE_SUPPORT_ACCESS_CATEGORIES.includes(values.category)
          ? values.allowSupportAccess
          : false,
    })
  }

  useEffect(() => {
    if (!!organizations && organizations.length > 0) {
      form.reset({
        conversation_id: conversationId,
        organizationSlug: organizations[0].slug,
        projectRef: NO_PROJECT_MARKER,
        category: '' as any,
        allowSupportAccess: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  return (
    <Form_Shadcn_ {...form}>
      <form
        id="link-support-ticket-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col"
      >
        <div className="flex flex-col py-6 gap-y-6">
          <h3 className="px-6 text-xl">Link support ticket to account</h3>
          <div className="px-6 flex flex-col gap-y-8">
            <FormField_Shadcn_
              control={form.control}
              name="conversation_id"
              render={({ field }) => (
                <FormItemLayout hideMessage layout="vertical" label="Conversation ID">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} readOnly />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <OrganizationSelector form={form as any} orgSlug={organizationSlug} />
            {organizationSlug !== NO_ORG_MARKER && (
              <ProjectAndPlanInfo
                form={form as any}
                orgSlug={selectedOrgSlug}
                projectRef={selectedProjectRef}
                subscriptionPlanId={subscriptionPlanId}
                category={category}
                showPlanExpectationInfo={false}
              />
            )}

            <CategoryAndSeverityInfo
              showSeverity={false}
              showIssueSuggestion={false}
              form={form as any}
              category={category}
              projectRef={projectRef}
            />
          </div>
        </div>

        <DialogSectionSeparator />

        {!!category && !DISABLE_SUPPORT_ACCESS_CATEGORIES.includes(category) && (
          <>
            <div className="py-4">
              <SupportAccessToggle form={form as any} />
            </div>
            <DialogSectionSeparator />
          </>
        )}

        <div className="px-6 py-8">
          <Button
            block
            type="primary"
            htmlType="submit"
            size="large"
            icon={<Link2 />}
            loading={isPending}
          >
            Link support ticket to account
          </Button>
        </div>
      </form>
    </Form_Shadcn_>
  )
}
