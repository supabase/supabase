import Link from 'next/link'
import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { Button, IconExternalLink } from 'ui'

const HIPAA = () => {
  const { slug } = useParams()
  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug })
  const currentPlan = subscription?.plan

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky space-y-6 top-12">
          <p className="text-base m-0">HIPAA</p>
          <div className="space-y-2 text-sm text-foreground-light m-0">
            <p>Organizations on Teams plan or above can request for a paid HIPAA add-on.</p>
            <p>
              This is only for HIPAA requests. Please ignore this if you already have HIPAA enabled.
            </p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isLoading && (
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}

          {isError && <AlertError subject="Failed to retrieve subscription" error={error} />}

          {isSuccess && (
            <div className="flex items-center justify-center h-full">
              {currentPlan?.id === 'free' || currentPlan?.id === 'pro' ? (
                <Link href={`/org/${slug}/billing?panel=subscriptionPlan`}>
                  <Button type="default">Upgrade to Teams</Button>
                </Link>
              ) : (
                <a
                  href="https://forms.supabase.com/hipaa2"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Button type="default" iconRight={<IconExternalLink />}>
                    Request HIPAA Form
                  </Button>
                </a>
              )}
            </div>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </>
  )
}

export default HIPAA
