import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

import { ApiAuthorizationApprovedScreen } from './ApiAuthorization.Approved'
import { ApiAuthorizationErrorScreen } from './ApiAuthorization.Error'
import { ApiAuthorizationMainView } from './ApiAuthorization.Form'
import { ApiAuthorizationLoadingScreen } from './ApiAuthorization.Loading'
import {
  approvalFormSchema,
  type ApprovalState,
  type IApprovalFormSchema,
} from './ApiAuthorization.Schema'
import { useApiAuthorizationApproveMutation } from '@/data/api-authorization/api-authorization-approve-mutation'
import { useApiAuthorizationDeclineMutation } from '@/data/api-authorization/api-authorization-decline-mutation'
import { useApiAuthorizationQuery } from '@/data/api-authorization/api-authorization-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import type { Organization } from '@/types'

function getMatchingOrganization(
  organization_slug: string | undefined,
  organizations: Array<Organization> | undefined
): Organization | null {
  if (!organization_slug || !organizations) return null
  return organizations.find(({ slug }) => slug === organization_slug) ?? null
}

interface PreselectOrganizationSlugParameters {
  form: UseFormReturn<IApprovalFormSchema>
  organization_slug: string | undefined
  organizations: Array<{ slug: string }>
}

function preselectOrganizationSlug({
  form,
  organization_slug,
  organizations,
}: PreselectOrganizationSlugParameters) {
  if (organization_slug) {
    const preselected = organizations.find(({ slug }) => slug === organization_slug)
    if (preselected) form.setValue('selectedOrgSlug', preselected.slug)
  } else if (!form.getValues('selectedOrgSlug') && organizations.length === 1) {
    form.setValue('selectedOrgSlug', organizations[0].slug)
  }
}

function useOrganizationsState(organization_slug: string | undefined) {
  const {
    data: organizations,
    isPending: isLoadingOrganizations,
    isError: isErrorOrganizations,
    error: organizationsError,
  } = useOrganizationsQuery()

  const organizationsState = useMemo(
    function calculateOrganizationsState() {
      if (isLoadingOrganizations) {
        return { _tag: 'loading' as const }
      }
      if (isErrorOrganizations) {
        return { _tag: 'error' as const, error: organizationsError }
      }
      if (organizations.length === 0) {
        return { _tag: 'empty' as const }
      }
      if (organization_slug) {
        const matchingOrganization = getMatchingOrganization(organization_slug, organizations)
        if (!matchingOrganization) {
          return { _tag: 'not_member' as const }
        }
      }
      return { _tag: 'success' as const, organizations }
    },
    [
      isLoadingOrganizations,
      isErrorOrganizations,
      organizationsError,
      organizations,
      organization_slug,
    ]
  )

  return organizationsState
}

function usePrefillFormOnOrganizationsSuccess(
  form: UseFormReturn<IApprovalFormSchema>,
  organizationsState: ReturnType<typeof useOrganizationsState>,
  organization_slug: string | undefined
) {
  const prefillForm = useStaticEffectEvent(() => {
    if (organizationsState._tag === 'success') {
      preselectOrganizationSlug({
        form,
        organization_slug,
        organizations: organizationsState.organizations,
      })
    }
  })
  useEffect(() => {
    if (organizationsState._tag === 'success') {
      prefillForm()
    }
  }, [organizationsState._tag, prefillForm])
}

export interface ApiAuthorizationValidScreenProps {
  auth_id: string
  organization_slug: string | undefined
  navigate: (destination: string) => void
}

export function ApiAuthorizationValidScreen({
  auth_id,
  organization_slug,
  navigate,
}: ApiAuthorizationValidScreenProps): ReactNode {
  const [approvalState, setApprovalState] = useState<ApprovalState>('indeterminate')

  const form = useForm<IApprovalFormSchema>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: { selectedOrgSlug: '' },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const organizationsState = useOrganizationsState(organization_slug)
  usePrefillFormOnOrganizationsSuccess(form, organizationsState, organization_slug)

  const {
    data: requester,
    isPending: isLoading,
    isError,
    error,
  } = useApiAuthorizationQuery({ id: auth_id })
  const isApproved = (requester?.approved_at ?? null) !== null

  const { mutate: approveRequest } = useApiAuthorizationApproveMutation({
    onSuccess: (res) => {
      window.location.href = res.url
    },
  })
  const { mutate: declineRequest } = useApiAuthorizationDeclineMutation({
    onSuccess: () => {
      toast.success('Declined API authorization request')
      navigate('/organizations')
    },
  })

  const onApproveRequest = form.handleSubmit((values) => {
    if (approvalState !== 'indeterminate') {
      return
    }
    setApprovalState('approving')
    approveRequest(
      { id: auth_id, slug: values.selectedOrgSlug },
      { onError: () => setApprovalState('indeterminate') }
    )
  })

  const onDeclineRequest = form.handleSubmit((values) => {
    if (approvalState !== 'indeterminate') {
      return
    }
    setApprovalState('declining')
    declineRequest(
      { id: auth_id, slug: values.selectedOrgSlug },
      { onError: () => setApprovalState('indeterminate') }
    )
  })

  if (isLoading) {
    return <ApiAuthorizationLoadingScreen />
  }

  if (isError) {
    return <ApiAuthorizationErrorScreen error={error} />
  }

  if (isApproved) {
    const approvedOrganization =
      organizationsState._tag === 'success'
        ? organizationsState.organizations.find(
            (org) => org.slug === requester.approved_organization_slug
          )
        : undefined

    return (
      <ApiAuthorizationApprovedScreen requester={requester} organization={approvedOrganization} />
    )
  }

  return (
    <ApiAuthorizationMainView
      approvalState={approvalState}
      form={form}
      requester={requester}
      requestedOrganizationSlug={organization_slug}
      organizations={organizationsState}
      onApprove={onApproveRequest}
      onDecline={onDeclineRequest}
    />
  )
}
