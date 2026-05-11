import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, type Dispatch } from 'react'
import { useForm, useWatch, type DefaultValues, type UseFormReturn } from 'react-hook-form'

import { SupportFormSchema, type SupportFormValues } from './SupportForm.schema'
import type { SupportFormActions } from './SupportForm.state'
import {
  loadSupportFormInitialParams,
  loadSupportFormInitialParamsFromObject,
  NO_ORG_MARKER,
  NO_PROJECT_MARKER,
  selectInitialOrgAndProject,
  type SupportFormUrlKeys,
} from './SupportForm.utils'
// End of third-party imports

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'

const supportFormBaseDefaults: DefaultValues<SupportFormValues> = {
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

export function useSupportForm(
  dispatch: Dispatch<SupportFormActions>,
  initialParams?: Partial<SupportFormUrlKeys>
): UseSupportFormResult {
  // Seed defaults from the URL synchronously so controlled fields like the
  // category Select start in their final state. Setting these via a useEffect
  // setValue makes Radix Select switch from uncontrolled to controlled
  // mid-mount, which on React 19 spuriously emits onValueChange('') and
  // clears the field. See radix-ui/primitives#3381.
  const initialParamsResult = useMemo(() => {
    return initialParams !== undefined
      ? loadSupportFormInitialParamsFromObject(initialParams)
      : loadSupportFormInitialParams(typeof window === 'undefined' ? '' : window.location.search)
    // Snapshot once; URL/object changes after mount are intentionally ignored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const supportFormDefaultValues = useMemo<DefaultValues<SupportFormValues>>(() => {
    return {
      ...supportFormBaseDefaults,
      ...(initialParamsResult.category ? { category: initialParamsResult.category } : {}),
      ...(typeof initialParamsResult.subject === 'string'
        ? { subject: initialParamsResult.subject }
        : {}),
      ...(typeof initialParamsResult.message === 'string'
        ? { message: initialParamsResult.message }
        : {}),
      ...(initialParamsResult.sid ? { dashboardSentryIssueId: initialParamsResult.sid } : {}),
    }
  }, [initialParamsResult])

  const form = useForm<SupportFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(SupportFormSchema),
    defaultValues: supportFormDefaultValues,
  })

  const urlParamsRef = useRef<SupportFormUrlKeys | null>(initialParamsResult)
  const initialError = initialParamsResult.error ?? null

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
