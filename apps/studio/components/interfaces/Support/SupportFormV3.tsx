// End of third-party imports
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useConstant, useFlag } from 'common'
import { CLIENT_LIBRARIES } from 'common/constants'
import { type Dispatch, type MouseEventHandler } from 'react'
import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Form, Separator } from 'ui'

import {
  AffectedServicesSelector,
  CATEGORIES_WITHOUT_AFFECTED_SERVICES,
} from './AffectedServicesSelector'
import { AttachmentUploadDisplay, useAttachmentUpload } from './AttachmentUpload'
import { CategoryAndSeverityInfo } from './CategoryAndSeverityInfo'
import { ClientLibraryInfo } from './ClientLibraryInfo'
import {
  DASHBOARD_LOG_CATEGORIES,
  getSanitizedBreadcrumbs,
  uploadDashboardLog,
} from './dashboard-logs'
import { DashboardLogsToggle } from './DashboardLogsToggle'
import { MessageField } from './MessageField'
import { OrganizationSelector } from './OrganizationSelector'
import { PlanExpectationInfoContent, ProjectAndPlanInfo } from './ProjectAndPlanInfo'
import { SubjectAndSuggestionsInfo } from './SubjectAndSuggestionsInfo'
import { SubmitButton } from './SubmitButton'
import { DISABLE_SUPPORT_ACCESS_CATEGORIES, SupportAccessToggle } from './SupportAccessToggle'
import type { SupportFormValues } from './SupportForm.schema'
import type { SupportFormActions, SupportFormState } from './SupportForm.state'
import {
  formatMessage,
  formatStudioVersion,
  getOrgSubscriptionPlan,
  NO_ORG_MARKER,
  NO_PROJECT_MARKER,
} from './SupportForm.utils'
import { SupportFormDirectEmailContent } from './SupportFormDirectEmailInfo'
import { getProjectAuthConfig } from '@/data/auth/auth-config-query'
import { useSendSupportTicketMutation } from '@/data/feedback/support-ticket-send'
import { type OrganizationPlanID } from '@/data/organizations/organization-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useGenerateAttachmentURLsMutation } from '@/data/support/generate-attachment-urls-mutation'
import { useDeploymentCommitQuery } from '@/data/utils/deployment-commit-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { detectBrowser } from '@/lib/helpers'
import { useProfile } from '@/lib/profile'

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

interface SupportFormV3Props {
  form: UseFormReturn<SupportFormValues>
  initialError: string | null
  state: SupportFormState
  dispatch: Dispatch<SupportFormActions>
  selectedProjectRef?: string | null
}

export const SupportFormV3 = ({
  form,
  initialError,
  state,
  dispatch,
  selectedProjectRef,
}: SupportFormV3Props) => {
  const { profile } = useProfile()
  const respondToEmail = profile?.primary_email ?? 'your email'

  const { organizationSlug, projectRef, category, severity, subject, library } = form.watch()

  const selectedOrgSlug = organizationSlug === NO_ORG_MARKER ? null : organizationSlug
  const currentProjectRef = projectRef === NO_PROJECT_MARKER ? null : projectRef

  const { data: organizations } = useOrganizationsQuery()
  const subscriptionPlanId = getOrgSubscriptionPlan(organizations, selectedOrgSlug)
  const simplifiedSupportForm = useIsSimplifiedForm(organizationSlug, subscriptionPlanId)
  const showClientLibraries = useIsFeatureEnabled('support:show_client_libraries')

  const attachmentUpload = useAttachmentUpload()
  const { mutateAsync: uploadDashboardLogFn } = useGenerateAttachmentURLsMutation()

  const sanitizedLogSnapshot = useConstant(getSanitizedBreadcrumbs)

  const { data: commit } = useDeploymentCommitQuery({
    staleTime: 1000 * 60 * 10,
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
        // Nice-to-have only
      }
    }

    submitSupportTicket(payload)
  }

  const handleFormSubmit = form.handleSubmit(onSubmit)

  const handleSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    handleFormSubmit(event)
  }

  const showPlanExpectationInfo =
    !!selectedOrgSlug &&
    subscriptionPlanId !== 'enterprise' &&
    subscriptionPlanId !== 'platform' &&
    category !== 'Login_issues'
  const showDirectEmailInfo = state.type !== 'success' && selectedProjectRef !== undefined

  return (
    <Form {...form}>
      <form id="support-form" className="flex min-h-full flex-col">
        <div className="flex flex-col gap-y-6">
          <OrganizationSelector form={form} orgSlug={organizationSlug} />
          <ProjectAndPlanInfo
            form={form}
            orgSlug={selectedOrgSlug}
            projectRef={currentProjectRef}
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

        <div className="flex flex-col gap-y-6 py-6">
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

        {(DASHBOARD_LOG_CATEGORIES.includes(category) ||
          (!!category && !DISABLE_SUPPORT_ACCESS_CATEGORIES.includes(category)) ||
          showPlanExpectationInfo ||
          showDirectEmailInfo) && (
          <div className="flex flex-col gap-y-6">
            <Separator />

            {DASHBOARD_LOG_CATEGORIES.includes(category) && (
              <DashboardLogsToggle form={form} sanitizedLog={sanitizedLogSnapshot} align="right" />
            )}

            {!!category && !DISABLE_SUPPORT_ACCESS_CATEGORIES.includes(category) && (
              <SupportAccessToggle form={form} align="right" />
            )}

            {(showPlanExpectationInfo || showDirectEmailInfo) && (
              <SupportFormV3AdditionalInfoSection
                orgSlug={selectedOrgSlug}
                subscriptionPlanId={subscriptionPlanId}
                projectRef={currentProjectRef}
                showPlanExpectationInfo={showPlanExpectationInfo}
                showDirectEmailInfo={showDirectEmailInfo}
              />
            )}
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-5 mt-6 border-t bg-panel-footer-light px-5 py-4">
          <SubmitButton
            isSubmitting={state.type === 'submitting'}
            userEmail={respondToEmail}
            onClick={handleSubmitButtonClick}
            descriptionClassName="pr-0"
          />
        </div>
      </form>
    </Form>
  )
}

interface SupportFormV3AdditionalInfoSectionProps {
  orgSlug: string | null
  subscriptionPlanId?: OrganizationPlanID
  projectRef: string | null
  showPlanExpectationInfo: boolean
  showDirectEmailInfo: boolean
}

function SupportFormV3AdditionalInfoSection({
  orgSlug,
  subscriptionPlanId,
  projectRef,
  showPlanExpectationInfo,
  showDirectEmailInfo,
}: SupportFormV3AdditionalInfoSectionProps) {
  return (
    <div className="flex flex-col gap-y-5">
      {showPlanExpectationInfo && orgSlug && (
        <div className="flex flex-col gap-y-2">
          <h5 className="text-foreground">Support varies by plan</h5>
          <PlanExpectationInfoContent orgSlug={orgSlug} planId={subscriptionPlanId} />
        </div>
      )}

      {showDirectEmailInfo && (
        <div className="flex flex-col gap-y-2">
          <h5 className="text-foreground">Having trouble submitting the form?</h5>
          <SupportFormDirectEmailContent projectRef={projectRef} />
        </div>
      )}
    </div>
  )
}
