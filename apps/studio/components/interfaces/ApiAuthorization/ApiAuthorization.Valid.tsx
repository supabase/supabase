import { zodResolver } from '@hookform/resolvers/zod'
import { OAuthScope } from '@supabase/shared-types/out/constants'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

import type { ApiAuthorizationMockState } from './ApiAuthorization'
import { ApiAuthorizationApprovedScreen } from './ApiAuthorization.Approved'
import { ApiAuthorizationErrorScreen } from './ApiAuthorization.Error'
import { ApiAuthorizationMainView, type OrganizationsState } from './ApiAuthorization.Form'
import { ApiAuthorizationLoadingScreen } from './ApiAuthorization.Loading'
import {
  approvalFormSchema,
  type ApprovalState,
  type IApprovalFormSchema,
} from './ApiAuthorization.Schema'
import { useApiAuthorizationApproveMutation } from '@/data/api-authorization/api-authorization-approve-mutation'
import { useApiAuthorizationDeclineMutation } from '@/data/api-authorization/api-authorization-decline-mutation'
import {
  useApiAuthorizationQuery,
  type ApiAuthorizationResponse,
  type ResourceError,
} from '@/data/api-authorization/api-authorization-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import type { Organization, ResponseError } from '@/types'

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

function useOrganizationsState(organization_slug: string | undefined, enabled = true) {
  const {
    data: organizations,
    isPending: isLoadingOrganizations,
    isError: isErrorOrganizations,
    error: organizationsError,
  } = useOrganizationsQuery({ enabled })

  const organizationsState = useMemo(
    function calculateOrganizationsState() {
      if (!enabled) {
        return { _tag: 'loading' as const }
      }
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
      enabled,
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
  mock?: ApiAuthorizationMockState
}

export function ApiAuthorizationValidScreen({
  auth_id,
  organization_slug,
  navigate,
  mock,
}: ApiAuthorizationValidScreenProps): ReactNode {
  const [approvalState, setApprovalState] = useState<ApprovalState>('indeterminate')

  const form = useForm<IApprovalFormSchema>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: { selectedOrgSlug: '' },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const organizationsState = useOrganizationsState(organization_slug, !mock)
  usePrefillFormOnOrganizationsSuccess(form, organizationsState, organization_slug)

  const {
    data: requester,
    isPending: isLoading,
    isError,
    error,
  } = useApiAuthorizationQuery({ id: auth_id }, { enabled: !mock })
  const isApproved = (requester?.approved_at ?? null) !== null

  const mockState = useMemo(() => (mock ? getMockAuthorizationState(mock) : null), [mock])

  useEffect(() => {
    if (mockState?.organizations._tag === 'success') {
      preselectOrganizationSlug({
        form,
        organization_slug: mockState.organizationSlug,
        organizations: mockState.organizations.organizations,
      })
    }
  }, [form, mockState])

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
    if (mockState) {
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

  if (mockState?.screen === 'loading' || (!mockState && isLoading)) {
    return <ApiAuthorizationLoadingScreen />
  }

  if (mockState?.screen === 'error' || (!mockState && isError)) {
    return <ApiAuthorizationErrorScreen error={mockState?.error ?? error ?? undefined} />
  }

  const effectiveRequester = mockState?.requester ?? requester
  const effectiveOrganizationsState = mockState?.organizations ?? organizationsState
  const effectiveOrganizationSlug = mockState?.organizationSlug ?? organization_slug
  const effectiveApprovalState = mockState?.approvalState ?? approvalState

  if (!effectiveRequester) return null

  if (mockState?.screen === 'approved' || (!mockState && isApproved)) {
    const approvedOrganization =
      effectiveOrganizationsState._tag === 'success'
        ? effectiveOrganizationsState.organizations.find(
            (org) => org.slug === effectiveRequester.approved_organization_slug
          )
        : undefined

    return (
      <ApiAuthorizationApprovedScreen
        requester={effectiveRequester}
        organization={approvedOrganization}
      />
    )
  }

  return (
    <ApiAuthorizationMainView
      approvalState={effectiveApprovalState}
      form={form}
      requester={effectiveRequester}
      requestedOrganizationSlug={effectiveOrganizationSlug}
      organizations={effectiveOrganizationsState}
      onApprove={onApproveRequest}
      onDecline={mockState ? () => navigate('/organizations') : onDeclineRequest}
    />
  )
}

const MOCK_ORGANIZATIONS: Organization[] = [
  createMockOrganization({
    id: 1,
    name: 'Toolshed',
    slug: 'toolshed',
    plan: { id: 'team', name: 'Team Plan' },
  }),
  createMockOrganization({
    id: 2,
    name: 'Personal',
    slug: 'personal',
    plan: { id: 'free', name: 'Free Plan' },
  }),
  createMockOrganization({
    id: 3,
    name: 'Acme Corp',
    slug: 'acme-corp',
    plan: { id: 'pro', name: 'Pro Plan' },
  }),
  createMockOrganization({
    id: 4,
    name: 'Northwind Labs',
    slug: 'northwind-labs',
    plan: { id: 'team', name: 'Team Plan' },
  }),
]

type MockAuthorizationState = {
  screen?: 'loading' | 'error' | 'approved'
  requester?: ApiAuthorizationResponse
  organizations: OrganizationsState
  organizationSlug?: string
  approvalState?: ApprovalState
  error?: ResourceError
}

function createMockOrganization(overrides: Partial<Organization>): Organization {
  return {
    id: 1,
    name: 'Toolshed',
    slug: 'toolshed',
    billing_email: 'billing@example.com',
    inserted_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    plan: { id: 'team', name: 'Team Plan' },
    managed_by: 'supabase',
    ...overrides,
  } as Organization
}

function createMockRequester(
  overrides: Partial<ApiAuthorizationResponse> = {}
): ApiAuthorizationResponse {
  return {
    name: 'Cursor',
    website: 'https://cursor.com',
    icon: null,
    domain: 'anysphere.cursor-mcp',
    scopes: [
      OAuthScope.DATABASE_READ,
      OAuthScope.DATABASE_WRITE,
      OAuthScope.EDGE_FUNCTIONS_READ,
      OAuthScope.EDGE_FUNCTIONS_WRITE,
      OAuthScope.ENVIRONMENT_READ,
      OAuthScope.ENVIRONMENT_WRITE,
      OAuthScope.PROJECTS_READ,
      OAuthScope.PROJECTS_WRITE,
      OAuthScope.ANALYTICS_READ,
      OAuthScope.ORGANIZATIONS_READ,
      OAuthScope.SECRETS_READ,
      OAuthScope.STORAGE_READ,
    ],
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    approved_at: null,
    registration_type: 'dynamic',
    ...overrides,
  }
}

function getMockAuthorizationState(mock: ApiAuthorizationMockState): MockAuthorizationState {
  const requester = createMockRequester()

  switch (mock) {
    case 'loading':
      return { screen: 'loading', organizations: { _tag: 'loading' } }
    case 'error':
      return {
        screen: 'error',
        organizations: { _tag: 'success', organizations: MOCK_ORGANIZATIONS },
        error: { errorEventId: 'mock', message: 'Authorization request not found.' },
      }
    case 'approved':
      return {
        screen: 'approved',
        requester: createMockRequester({
          approved_at: new Date().toISOString(),
          approved_organization_slug: 'toolshed',
        }),
        organizations: { _tag: 'success', organizations: MOCK_ORGANIZATIONS },
      }
    case 'expired':
      return {
        requester: createMockRequester({
          expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        }),
        organizations: { _tag: 'success', organizations: MOCK_ORGANIZATIONS },
      }
    case 'organizations-loading':
      return { requester, organizations: { _tag: 'loading' } }
    case 'organizations-error':
      return {
        requester,
        organizations: {
          _tag: 'error',
          error: { message: 'Failed to load organizations.' } as ResponseError,
        },
      }
    case 'empty':
      return { requester, organizations: { _tag: 'empty' } }
    case 'not-member':
      return { requester, organizationSlug: 'missing-org', organizations: { _tag: 'not_member' } }
    case 'approving':
      return {
        requester,
        organizations: { _tag: 'success', organizations: MOCK_ORGANIZATIONS },
        approvalState: 'approving',
      }
    case 'ready':
    case 'mcp':
    default:
      return {
        requester:
          mock === 'mcp'
            ? createMockRequester({ registration_type: 'dynamic' })
            : createMockRequester({ registration_type: 'static' }),
        organizations: { _tag: 'success', organizations: MOCK_ORGANIZATIONS },
      }
  }
}
