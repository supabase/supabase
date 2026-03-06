import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  LogoLoader,
  WarningIcon,
} from 'ui'

import APIAuthorizationLayout from '@/components/layouts/APIAuthorizationLayout'
import { useConfirmAccountRequestMutation } from '@/data/partners/stripe-fabric-confirm-mutation'
import { accountRequestQueryOptions } from '@/data/partners/stripe-fabric-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { useSignOut } from '@/lib/auth'

const StripeFabricLoginPage = () => {
  const router = useRouter()
  const { ar_id } = useParams()

  const signOut = useSignOut()

  const {
    data: accountRequest,
    isPending,
    isSuccess,
    isError,
    error,
  } = useQuery(accountRequestQueryOptions({ arId: ar_id }))

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

  const handleApprove = async () => {
    if (!ar_id) return

    confirmAccountRequest({ arId: ar_id })
    // The onSuccess handler in the mutation will show a success screen, on error it'll show a toast, so we don't need
    // to do anything else here
  }

  return (
    <APIAuthorizationLayout>
      <div className="flex flex-col items-center justify-center h-full">
        {isConfirming ? (
          <>
            <LogoLoader />
            <p className="pt-4 text-foreground-light">Setting up your organization...</p>
          </>
        ) : isConfirmed ? (
          <>
            <h2 className="py-2 text-lg font-medium">Organization Created</h2>
            <p className="text-foreground-light">
              Your Supabase organization has been linked successfully.
            </p>
            <p className="pt-4 text-sm text-foreground-lighter">You can close this window.</p>
          </>
        ) : isPending ? (
          <LogoLoader />
        ) : isSuccess ? (
          <>
            <h2 className="py-2 text-lg font-medium">Stripe Fabric Account Request</h2>
            <p className="text-center text-foreground-light">
              Stripe Fabric wants to create a Supabase organization for{' '}
              <strong>{accountRequest.email}</strong>
              {accountRequest.name && <> ({accountRequest.name})</>}.
            </p>
            {(accountRequest as any).email_matches ? (
              <div className="py-6">
                <Button size="large" type="primary" onClick={handleApprove}>
                  Approve
                </Button>
              </div>
            ) : (
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
            )}
            <p className="text-sm text-foreground-lighter text-center">
              This will create a new Supabase organization linked to your Stripe account.
            </p>
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
