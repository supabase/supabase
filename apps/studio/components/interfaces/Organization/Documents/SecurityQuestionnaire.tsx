import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { getDocument } from 'data/documents/document-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

export const SecurityQuestionnaire = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug

  const { mutate: sendEvent } = useSendEventMutation()
  const { can: canReadSubscriptions, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const currentPlan = organization?.plan

  const fetchQuestionnaire = async (orgSlug: string) => {
    try {
      const questionnaireLink = await getDocument({
        orgSlug,
        docType: 'standard-security-questionnaire',
      })
      if (questionnaireLink?.fileUrl) window.open(questionnaireLink.fileUrl, '_blank')
    } catch (error: any) {
      toast.error(`Failed to download Security Questionnaire: ${error.message}`)
    }
  }

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky space-y-6 top-12">
          <p className="text-base m-0">Standard Security Questionnaire</p>
          <div className="space-y-2 text-sm text-foreground-light m-0">
            <p>
              Organizations on Team Plan or above have access to our standard security
              questionnaire.
            </p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isLoadingPermissions ? (
            <div className="flex items-center justify-center h-full">
              <ShimmeringLoader className="w-24" />
            </div>
          ) : !canReadSubscriptions ? (
            <NoPermission resourceText="access our security questionnaire" />
          ) : (
            <>
              <div className="flex items-center justify-center h-full">
                {currentPlan?.id === 'free' || currentPlan?.id === 'pro' ? (
                  <Link
                    href={`/org/${slug}/billing?panel=subscriptionPlan&source=securityQuestionnaire`}
                  >
                    <Button type="default">Upgrade to Team</Button>
                  </Link>
                ) : (
                  <Button
                    type="default"
                    icon={<Download />}
                    onClick={() => {
                      sendEvent({
                        action: 'document_view_button_clicked',
                        properties: { documentName: 'Standard Security Questionnaire' },
                        groups: { organization: organization?.slug ?? 'Unknown' },
                      })
                      if (slug) fetchQuestionnaire(slug)
                    }}
                  >
                    Download Questionnaire
                  </Button>
                )}
              </div>
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </>
  )
}
