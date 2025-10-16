import { type Dispatch, type MouseEventHandler } from 'react'
import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { CLIENT_LIBRARIES } from 'common/constants'
import { getProjectAuthConfig } from 'data/auth/auth-config-query'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useDeploymentCommitQuery } from 'data/utils/deployment-commit-query'
import { detectBrowser } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { DialogSectionSeparator, Form_Shadcn_, Separator } from 'ui'
import {
  AffectedServicesSelector,
  CATEGORIES_WITHOUT_AFFECTED_SERVICES,
} from './AffectedServicesSelector'
import { AttachmentUploadDisplay, useAttachmentUpload } from './AttachmentUpload'
import { CategoryAndSeverityInfo } from './CategoryAndSeverityInfo'
import { ClientLibraryInfo } from './ClientLibraryInfo'
import { MessageField } from './MessageField'
import { OrganizationSelector } from './OrganizationSelector'
import { ProjectAndPlanInfo } from './ProjectAndPlanInfo'
import { SubjectAndSuggestionsInfo } from './SubjectAndSuggestionsInfo'
import { SubmitButton } from './SubmitButton'
import { SUPPORT_ACCESS_CATEGORIES, SupportAccessToggle } from './SupportAccessToggle'
import type { SupportFormValues } from './SupportForm.schema'
import type { SupportFormActions, SupportFormState } from './SupportForm.state'
import {
  formatMessage,
  getOrgSubscriptionPlan,
  NO_ORG_MARKER,
  NO_PROJECT_MARKER,
} from './SupportForm.utils'

interface SupportFormV2Props {
  form: UseFormReturn<SupportFormValues>
  initialError: string | null
  state: SupportFormState
  dispatch: Dispatch<SupportFormActions>
}

export const SupportFormV2 = ({ form, initialError, state, dispatch }: SupportFormV2Props) => {
  const { profile } = useProfile()
  const respondToEmail = profile?.primary_email ?? 'your email'

  const { organizationSlug, projectRef, category, severity, subject, library } = form.watch()

  const selectedOrgSlug = organizationSlug === NO_ORG_MARKER ? null : organizationSlug
  const selectedProjectRef = projectRef === NO_PROJECT_MARKER ? null : projectRef

  const { data: organizations } = useOrganizationsQuery()
  const subscriptionPlanId = getOrgSubscriptionPlan(organizations, selectedOrgSlug)

  const attachmentUpload = useAttachmentUpload()

  const { data: commit } = useDeploymentCommitQuery({
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  const { mutate: submitSupportTicket } = useSendSupportTicketMutation({
    onSuccess: (_, variables) => {
      dispatch({
        type: 'SUCCESS',
        sentProjectRef: variables.projectRef,
        sentOrgSlug: variables.organizationSlug,
        sentCategory: variables.category,
      })
    },
    onError: (error) => {
      dispatch({
        type: 'ERROR',
        message: error.message,
      })
    },
  })

  const onSubmit: SubmitHandler<SupportFormValues> = async (values) => {
    dispatch({ type: 'SUBMIT' })
    const attachments = await attachmentUpload.createAttachments()

    const selectedLibrary = values.library
      ? CLIENT_LIBRARIES.find((library) => library.language === values.library)
      : undefined

    const payload = {
      ...values,
      organizationSlug: values.organizationSlug ?? NO_ORG_MARKER,
      projectRef: values.projectRef ?? NO_PROJECT_MARKER,
      allowSupportAccess: SUPPORT_ACCESS_CATEGORIES.includes(values.category)
        ? values.allowSupportAccess
        : false,
      library:
        values.category === SupportCategories.PROBLEM && selectedLibrary !== undefined
          ? selectedLibrary.key
          : '',
      message: formatMessage({
        message: values.message,
        attachments,
        error: initialError,
        commit: commit?.commitSha,
      }),
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl: '',
      additionalRedirectUrls: '',
      affectedServices: CATEGORIES_WITHOUT_AFFECTED_SERVICES.includes(values.category)
        ? ''
        : values.affectedServices
            .split(',')
            .map((x) => x.trim().replace(/ /g, '_').toLowerCase())
            .join(';'),
      browserInformation: detectBrowser(),
    }

    if (values.projectRef !== NO_PROJECT_MARKER) {
      try {
        const authConfig = await getProjectAuthConfig({
          projectRef: values.projectRef,
        })
        payload.siteUrl = authConfig.SITE_URL
        payload.additionalRedirectUrls = authConfig.URI_ALLOW_LIST
      } catch {
        // [Joshen] No error handler required as fetching these info are nice to haves, not necessary
      }
    }

    submitSupportTicket(payload)
  }

  const handleFormSubmit = form.handleSubmit(onSubmit)

  const handleSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    handleFormSubmit(event)
  }

  return (
    <Form_Shadcn_ {...form}>
      <form id="support-form" className="flex flex-col gap-y-6">
        <h3 className="px-6 text-xl">How can we help?</h3>

        <div className="px-6 flex flex-col gap-y-8">
          <OrganizationSelector form={form} orgSlug={organizationSlug} />
          <ProjectAndPlanInfo
            form={form}
            orgSlug={selectedOrgSlug}
            projectRef={selectedProjectRef}
            subscriptionPlanId={subscriptionPlanId}
            category={category}
          />
          <CategoryAndSeverityInfo
            form={form}
            category={category}
            severity={severity}
            projectRef={projectRef}
          />
        </div>

        <DialogSectionSeparator />

        <div className="px-6 flex flex-col gap-y-8">
          <SubjectAndSuggestionsInfo form={form} subject={subject} category={category} />
          <ClientLibraryInfo form={form} library={library} category={category} />
          <AffectedServicesSelector form={form} category={category} />
          <MessageField form={form} originalError={initialError} />
          <AttachmentUploadDisplay {...attachmentUpload} />
        </div>

        <DialogSectionSeparator />

        <div className="px-6 flex flex-col gap-y-8">
          {SUPPORT_ACCESS_CATEGORIES.includes(category) && (
            <>
              <SupportAccessToggle form={form} />
              <Separator />
            </>
          )}
          <SubmitButton
            isSubmitting={state.type === 'submitting'}
            userEmail={respondToEmail}
            onClick={handleSubmitButtonClick}
          />
        </div>
      </form>
    </Form_Shadcn_>
  )
}
