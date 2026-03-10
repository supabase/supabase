import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  LogoLoader,
  WarningIcon,
} from 'ui'

import APIAuthorizationLayout from '@/components/layouts/APIAuthorizationLayout'
import { OrganizationSelector } from '@/components/ui/org-selector'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useConfirmAccountRequestMutation } from '@/data/partners/stripe-fabric-confirm-mutation'
import {
  accountRequestQueryOptions,
  type AccountRequestDetails,
} from '@/data/partners/stripe-fabric-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { useSignOut } from '@/lib/auth'

type OrgSummary = NonNullable<AccountRequestDetails['linked_organization']>

const StripeFabricLoginPage = () => {
  const router = useRouter()
  const { ar_id } = useParams()

  const signOut = useSignOut()

  const [selectedOrg, setSelectedOrg] = useState<OrgSummary | null>(null)
  const [orgConfirmed, setOrgConfirmed] = useState(false)

  const {
    data: accountRequest,
    isPending,
    isSuccess,
    isError,
    error,
  } = useQuery(accountRequestQueryOptions({ arId: ar_id }))
  const { data: organizations = [] } = useOrganizationsQuery()

  const {
    mutateAsync: confirmAccountRequest,
    isPending: isConfirming,
    isSuccess: isConfirmed,
  } = useConfirmAccountRequestMutation()

  useEffect(() => {
    if (!router.isReady) return

    if (!ar_id) {
      router.push('/404')
      return
    }
  }, [router.isReady, ar_id, router])

  const handleApprove = async (organizationId?: number) => {
    if (!ar_id || isConfirming) return
    confirmAccountRequest({ arId: ar_id, organizationId })
  }

  // linked_organization is set when an org is already linked to this Stripe account+org pair
  // userOrgs is the list of user's orgs to pick from (only when no linked org)
  const linkedOrg = accountRequest?.linked_organization
  const userOrgs = organizations ?? []
  const emailMatches = accountRequest?.email_matches ?? false

  const orgCount = userOrgs.length

  // isReauth = org already linked, user is just completing the authorization flow again
  const isReauth = !!linkedOrg
  const isLinking = isReauth || orgCount >= 1

  const loadingText = isReauth
    ? 'Completing authorization...'
    : isLinking
      ? 'Linking your organization...'
      : 'Setting up your organization...'
  const successTitle = isReauth
    ? 'Authorization Complete'
    : isLinking
      ? 'Organization Linked'
      : 'Organization Created'
  const successDescription = isReauth
    ? `Your Stripe account is connected to ${linkedOrg?.name}.`
    : isLinking
      ? 'Your Supabase organization has been linked to your Stripe account.'
      : 'Your Supabase organization has been created and linked to your Stripe account.'

  return (
    <APIAuthorizationLayout>
      <div className="flex flex-col items-center min-h-[500px]">
        {isConfirming ? (
          <>
            <LogoLoader />
            <p className="pt-4 text-foreground-light">{loadingText}</p>
          </>
        ) : isConfirmed ? (
          <>
            <h2 className="py-2 text-lg font-medium">{successTitle}</h2>
            <p className="text-foreground-light">{successDescription}</p>
            <p className="pt-4 text-sm text-foreground-lighter">You can close this window.</p>
          </>
        ) : isPending ? (
          <LogoLoader />
        ) : isSuccess ? (
          <>
            <h2 className="py-2 text-lg font-medium">Stripe Account Authorization</h2>
            <p className="text-center text-foreground-light">
              Stripe wants to link a Supabase organization for{' '}
              <strong>{accountRequest.email}</strong>
              {accountRequest.name && <> ({accountRequest.name})</>}.
            </p>

            {!emailMatches ? (
              <>
                <Alert_Shadcn_ variant="warning" className="mt-4">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Wrong account</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    You need to be logged in as <strong>{accountRequest.email}</strong> to approve
                    this request.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <div className="py-6">
                  <Button size="large" type="default" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              </>
            ) : linkedOrg ? (
              // Org already linked to this Stripe account — inform user, no choice
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  Your organization <strong>{linkedOrg.name}</strong> is already linked to your
                  Stripe account. Approve to continue.
                </p>
                <div className="py-6">
                  <Button
                    size="large"
                    type="primary"
                    disabled={isConfirming}
                    onClick={() => handleApprove()}
                  >
                    Approve
                  </Button>
                </div>
              </>
            ) : orgCount === 0 ? (
              // No orgs at all — a new one will be created
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  A new Supabase organization will be created and linked to your Stripe account.
                </p>
                <div className="py-6">
                  <Button
                    size="large"
                    type="primary"
                    disabled={isConfirming}
                    onClick={() => handleApprove()}
                  >
                    Approve
                  </Button>
                </div>
              </>
            ) : orgCount === 1 ? (
              // Exactly one org — show its name and approve directly
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  Your organization <strong>{userOrgs[0].name}</strong> will be linked to your
                  Stripe account.
                </p>
                <div className="py-6">
                  <Button
                    size="large"
                    type="primary"
                    disabled={isConfirming}
                    onClick={() => handleApprove(userOrgs[0].id)}
                  >
                    Approve
                  </Button>
                </div>
              </>
            ) : !orgConfirmed ? (
              // 2+ orgs — show picker
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  Select the organization you'd like to link to your Stripe account.
                </p>
                <div className="mt-4 w-96">
                  <OrganizationSelector
                    onSelect={(slug) => {
                      const org = userOrgs.find((o) => o.slug === slug) ?? null
                      setSelectedOrg(org)
                      if (org) {
                        setOrgConfirmed(true)
                      }
                    }}
                    maxOrgsToShow={3}
                    canCreateNewOrg={false}
                  />
                </div>
              </>
            ) : (
              // 2+ orgs — org selected, show confirmation
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  Link <strong>{selectedOrg!.name}</strong> to your Stripe account?
                </p>
                <div className="py-6 flex flex-col items-center gap-3">
                  <Button
                    size="large"
                    type="primary"
                    disabled={isConfirming}
                    onClick={() => handleApprove(selectedOrg!.id)}
                  >
                    Approve
                  </Button>
                  <button
                    className="text-sm text-foreground-lighter underline hover:text-foreground-light"
                    onClick={() => {
                      setSelectedOrg(null)
                      setOrgConfirmed(false)
                    }}
                  >
                    Change organization
                  </button>
                </div>
              </>
            )}
          </>
        ) : isError ? (
          <>
            <h2 className="py-2 text-lg font-medium text-destructive">Error</h2>
            <p className="text-foreground-light">{error?.message}</p>
          </>
        ) : null}
      </div>
    </APIAuthorizationLayout>
  )
}

export default withAuth(StripeFabricLoginPage)
