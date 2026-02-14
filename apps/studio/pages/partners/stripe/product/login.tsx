import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import {
  confirmAccountRequest,
  getAccountRequest,
  type AccountRequestDetails,
} from 'data/partners/stripe-product'
import { withAuth } from 'hooks/misc/withAuth'
import { useSignOut } from 'lib/auth'
import type { NextPageWithLayout } from 'types'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  LogoLoader,
  WarningIcon,
} from 'ui'

type PageState = 'loading' | 'approval' | 'processing' | 'success' | 'error'

const StripeProductLoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ar_id } = useParams()

  const signOut = useSignOut()
  const [state, setState] = useState<PageState>('loading')
  const [accountRequest, setAccountRequest] = useState<AccountRequestDetails | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (!router.isReady) return

    if (!ar_id) {
      router.push('/404')
      return
    }

    async function loadAccountRequest() {
      try {
        const ar = await getAccountRequest(ar_id!)
        setAccountRequest(ar)
        setState('approval')
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to load account request')
        setState('error')
      }
    }

    loadAccountRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, ar_id])

  async function handleApprove() {
    if (!ar_id) return

    setState('processing')
    try {
      await confirmAccountRequest(ar_id)
      setState('success')
    } catch (error: any) {
      toast.error(`Failed to confirm: ${error.message}`)
      setState('approval')
    }
  }

  return (
    <APIAuthorizationLayout>
      <div className="flex flex-col items-center justify-center h-full">
        {state === 'loading' && <LogoLoader />}

        {state === 'approval' && accountRequest && (
          <>
            <h2 className="py-2 text-lg font-medium">Stripe Product Account Request</h2>
            <p className="text-center text-foreground-light">
              Stripe Product wants to create a Supabase organization for{' '}
              <strong>{accountRequest.email}</strong>
              {accountRequest.name && <> ({accountRequest.name})</>}.
            </p>
            {accountRequest.email_matches ? (
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
        )}

        {state === 'processing' && (
          <>
            <LogoLoader />
            <p className="pt-4 text-foreground-light">Setting up your organization...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <h2 className="py-2 text-lg font-medium">Organization Created</h2>
            <p className="text-foreground-light">
              Your Supabase organization has been linked successfully.
            </p>
            <p className="pt-4 text-sm text-foreground-lighter">You can close this window.</p>
          </>
        )}

        {state === 'error' && (
          <>
            <h2 className="py-2 text-lg font-medium text-destructive">Error</h2>
            <p className="text-foreground-light">{errorMessage}</p>
          </>
        )}
      </div>
    </APIAuthorizationLayout>
  )
}

export default withAuth(StripeProductLoginPage)
