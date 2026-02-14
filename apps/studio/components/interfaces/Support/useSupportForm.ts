import { zodResolver } from '@hookform/resolvers/zod'
import { type Dispatch, useEffect, useRef, useState } from 'react'
import { type DefaultValues, type UseFormReturn, useForm, useWatch } from 'react-hook-form'
// End of third-party imports

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { SupportFormSchema, type SupportFormValues } from './SupportForm.schema'
import type { SupportFormActions } from './SupportForm.state'
import {
  NO_ORG_MARKER,
  NO_PROJECT_MARKER,
  type SupportFormUrlKeys,
  loadSupportFormInitialParams,
  selectInitialOrgAndProject,
} from './SupportForm.utils'

const supportFormDefaultValues: DefaultValues<SupportFormValues> = {
  organizationSlug: NO_ORG_MARKER,
  projectRef: NO_PROJECT_MARKER,
  severity: 'Low',
  category: undefined,
  library: '',
  subject: '',
  message: '',
  affectedServices: '',
  allowSupportAccess: true,
  attachDashboardLogs: true,
  dashboardSentryIssueId: '',
}

interface UseSupportFormResult {
  form: UseFormReturn<SupportFormValues>
  initialError: string | null
  projectRef: string | null
  orgSlug: string | null
}

export function useSupportForm(dispatch: Dispatch<SupportFormActions>): UseSupportFormResult {
  const form = useForm<SupportFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(SupportFormSchema),
    defaultValues: supportFormDefaultValues,
  })

  const urlParamsRef = useRef<SupportFormUrlKeys | null>(null)
  const [initialError, setInitialError] = useState<string | null>(null)

  // Load initial values from URL params
  useEffect(() => {
    const params = loadSupportFormInitialParams(window.location.search)
    urlParamsRef.current = params
    setInitialError(params.error ?? null)

    if (params.category && !form.getFieldState('category').isDirty) {
      form.setValue('category', params.category, { shouldDirty: false })
    }
    if (typeof params.subject === 'string' && !form.getFieldState('subject').isDirty) {
      form.setValue('subject', params.subject, { shouldDirty: false })
    }
    if (typeof params.message === 'string' && !form.getFieldState('message').isDirty) {
      form.setValue('message', params.message, { shouldDirty: false })
    }
    if (params.sid && !form.getFieldState('dashboardSentryIssueId').isDirty) {
      form.setValue('dashboardSentryIssueId', params.sid, {
        shouldDirty: false,
      })
    }
  }, [form])

  const hasAppliedOrgProjectRef = useRef(false)
  const { data: organizations, isPending: organizationsLoading } = useOrganizationsQuery()

  // Organization slug and project ref need to be validated after loading from
  // URL params
  useEffect(() => {
    if (hasAppliedOrgProjectRef.current) return
    if (!urlParamsRef.current) return
    if (organizationsLoading) return

    hasAppliedOrgProjectRef.current = true

    const orgSlugFromUrl =
      urlParamsRef.current.orgSlug && urlParamsRef.current.orgSlug !== NO_ORG_MARKER
        ? urlParamsRef.current.orgSlug
        : null
    const projectRefFromUrl = urlParamsRef.current.projectRef ?? null

    selectInitialOrgAndProject({
      projectRef: projectRefFromUrl,
      orgSlug: orgSlugFromUrl,
      orgs: organizations ?? [],
    })
      .then(({ orgSlug, projectRef }) => {
        if (!form.getFieldState('organizationSlug').isDirty) {
          form.setValue('organizationSlug', orgSlug ?? NO_ORG_MARKER, {
            shouldDirty: false,
          })
        }
        if (!form.getFieldState('projectRef').isDirty) {
          form.setValue('projectRef', projectRef ?? NO_PROJECT_MARKER, {
            shouldDirty: false,
          })
        }
      })
      .catch(() => {
        // Ignored: fall back to defaults when lookup fails
      })
      .finally(() => {
        dispatch({ type: 'INITIALIZE', debugSource: 'useSupportForm' })
      })
  }, [organizations, organizationsLoading, form, dispatch])

  const watchedProjectRef = useWatch({
    control: form.control,
    name: 'projectRef',
  })
  const watchedOrgSlug = useWatch({
    control: form.control,
    name: 'organizationSlug',
  })

  const projectRef =
    watchedProjectRef && watchedProjectRef !== NO_PROJECT_MARKER ? watchedProjectRef : null
  const orgSlug = watchedOrgSlug && watchedOrgSlug !== NO_ORG_MARKER ? watchedOrgSlug : null

  return {
    form,
    initialError,
    projectRef,
    orgSlug,
  }
}
