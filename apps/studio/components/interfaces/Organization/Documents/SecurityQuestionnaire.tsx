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
import { Button, IconDownload } from 'ui'
import { useStore } from 'hooks'
import { getDocument } from 'data/documents/document-query'

const SecurityQuestionnaire = () => {
  const { slug } = useParams()
  const { ui } = useStore()
  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug })
  const currentPlan = subscription?.plan

  const fetchQuestionnaire = async (orgSlug: string) => {
    try {
      const questionnaireLink = await getDocument({
        orgSlug,
        docType: 'standard-security-questionnaire',
      })
      if (questionnaireLink?.fileUrl) window.open(questionnaireLink.fileUrl, '_blank')
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to download Security Questionnaire: ${error.message}`,
      })
    }
  }

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky space-y-6 top-12">
          <p className="text-base m-0">Standard Security Questionnaire</p>
          <div className="space-y-2 text-sm text-foreground-light m-0">
            <p>
              Organizations on Teams plan or above have access to our standard security
              questionnaire.
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
                <Button
                  type="default"
                  iconRight={<IconDownload />}
                  onClick={() => {
                    if (slug) fetchQuestionnaire(slug)
                  }}
                >
                  Download Questionnaire
                </Button>
              )}
            </div>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </>
  )
}

export default SecurityQuestionnaire
