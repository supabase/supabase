// End of third-party imports
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useConstant, useFlag } from 'common'
import { CLIENT_LIBRARIES } from 'common/constants'
import { getProjectAuthConfig } from 'data/auth/auth-config-query'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { type OrganizationPlanID } from 'data/organizations/organization-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useGenerateAttachmentURLsMutation } from 'data/support/generate-attachment-urls-mutation'
import { useDeploymentCommitQuery } from 'data/utils/deployment-commit-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { detectBrowser } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { type Dispatch, type MouseEventHandler } from 'react'
import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { DialogSectionSeparator, Form_Shadcn_ } from 'ui'

import {
  AffectedServicesSelector,
  CATEGORIES_WITHOUT_AFFECTED_SERVICES,
} from './AffectedServicesSelector'
import { AttachmentUploadDisplay, useAttachmentUpload } from './AttachmentUpload'
import { CategoryAndSeverityInfo } from './CategoryAndSeverityInfo'
import { ClientLibraryInfo } from './ClientLibraryInfo'
import { DashboardLogsToggle } from './DashboardLogsToggle'
import { MessageField } from './MessageField'
import { OrganizationSelector } from './OrganizationSelector'
import { ProjectAndPlanInfo } from './ProjectAndPlanInfo'
import { SubjectAndSuggestionsInfo } from './SubjectAndSuggestionsInfo'
import { SubmitButton } from './SubmitButton'
import { DISABLE_SUPPORT_ACCESS_CATEGORIES, SupportAccessToggle } from './SupportAccessToggle'
import type { SupportFormValues } from './SupportForm.schema'
import type { SupportFormActions, SupportFormState } from './SupportForm.state'
import {
  NO_ORG_MARKER,
  NO_PROJECT_MARKER,
  formatMessage,
  formatStudioVersion,
  getOrgSubscriptionPlan,
} from './SupportForm.utils'
import {
  DASHBOARD_LOG_CATEGORIES,
  getSanitizedBreadcrumbs,
  uploadDashboardLog,
} from './dashboard-logs'

const useIsSimplifiedForm = (slug: string, subscriptionPlanId?: OrganizationPlanID) => {
  const simplifiedSupportForm = useFlag('simplifiedSupportForm')

  if (subscriptionPlanId === 'platform') {
    return true
  }

  if (typeof simplifiedSupportForm === 'string') {
    const slugs = (simplifiedSupportForm as string).split(',').map((x) => x.trim())
    return slugs.includes(slug)
  }

  return false
}

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
  const simplifiedSupportForm = useIsSimplifiedForm(organizationSlug, subscriptionPlanId)
  const showClientLibraries = useIsFeatureEnabled('support:show_client_libraries')

  const attachmentUpload = useAttachmentUpload()
  const { mutateAsync: uploadDashboardLogFn } = useGenerateAttachmentURLsMutation()

  const sanitizedLogSnapshot = useConstant(getSanitizedBreadcrumbs)

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

  const onSubmit: SubmitHandler<SupportFormValues> = async (formValues) => {
    // Library is required when selecting "APIs and Client Libraries" category,
    // but only when the library selector is visible (not in simplified form)
    if (
      !simplifiedSupportForm &&
      showClientLibraries &&
      formValues.category === SupportCategories.PROBLEM &&
      !formValues.library
    ) {
      form.setError('library', {
        type: 'manual',
        message: "Please select the library that you're facing issues with",
      })
      return
    }

    dispatch({ type: 'SUBMIT' })

    const { attachDashboardLogs: formAttachDashboardLogs, ...values } = formValues
    const attachDashboardLogs =
      formAttachDashboardLogs && DASHBOARD_LOG_CATEGORIES.includes(values.category)

    const [attachments, dashboardLogUrl] = await Promise.all([
      attachmentUpload.createAttachments(),
      attachDashboardLogs
        ? uploadDashboardLog({
            userId: profile?.gotrue_id,
            sanitizedLogs: sanitizedLogSnapshot,
            uploadDashboardLogFn,
          })
        : undefined,
    ])

    const selectedLibrary = values.library
      ? CLIENT_LIBRARIES.find((library) => library.language === values.library)
      : undefined

    const payload = {
      ...values,
      organizationSlug: values.organizationSlug ?? NO_ORG_MARKER,
      projectRef: values.projectRef ?? NO_PROJECT_MARKER,
      allowSupportAccess:
        values.category && !DISABLE_SUPPORT_ACCESS_CATEGORIES.includes(values.category)
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
      dashboardLogs: dashboardLogUrl?.[0],
      dashboardStudioVersion: commit ? formatStudioVersion(commit) : undefined,
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
          {!simplifiedSupportForm && (
            <>
              <ClientLibraryInfo form={form} library={library} category={category} />
              <AffectedServicesSelector form={form} category={category} />
            </>
          )}
          <MessageField form={form} originalError={initialError} />
          <AttachmentUploadDisplay {...attachmentUpload} />
        </div>

        <DialogSectionSeparator />

        {DASHBOARD_LOG_CATEGORIES.includes(category) && (
          <>
            <DashboardLogsToggle form={form} sanitizedLog={sanitizedLogSnapshot} />
            <DialogSectionSeparator />
          </>
        )}

        {!!category && !DISABLE_SUPPORT_ACCESS_CATEGORIES.includes(category) && (
          <>
            <SupportAccessToggle form={form} />
            <DialogSectionSeparator />
          </>
        )}

        <div className="px-6 pt-2">
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
