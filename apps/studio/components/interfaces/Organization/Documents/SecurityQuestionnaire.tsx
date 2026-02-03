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
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const SecurityQuestionnaire = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug

  const { mutate: sendEvent } = useSendEventMutation()
  const { can: canReadSubscriptions, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )
  const { hasAccess: hasAccessToQuestionnaire, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('security.questionnaire')

  const fetchQuestionnaire = async (orgSlug: string) => {
    try {
      const questionnaireLink = await getDocument({
        orgSlug,
        docType: 'standard-security-questionnaire',
      })
      if (questionnaireLink?.fileUrl) window.open(questionnaireLink.fileUrl, '_blank')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to download Security Questionnaire: ${message}`)
    }
  }

  const handleDownloadClick = () => {
    if (!slug) return

    sendEvent({
      action: 'document_view_button_clicked',
      properties: { documentName: 'Standard Security Questionnaire' },
      groups: { organization: slug },
    })
    fetchQuestionnaire(slug)
  }

  return (
    <ScaffoldSection className="py-12">
      <ScaffoldSectionDetail>
        <h4 className="mb-5">Standard Security Questionnaire</h4>
        <div className="space-y-2 text-sm text-foreground-light [&_p]:m-0">
          <p>
            Organizations on Team Plan or above have access to our standard security questionnaire.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {isLoadingPermissions || isLoadingEntitlement ? (
          <div className="@lg:flex items-center justify-center h-full">
            <ShimmeringLoader className="w-24" />
          </div>
        ) : !canReadSubscriptions ? (
          <NoPermission resourceText="access our security questionnaire" />
        ) : !hasAccessToQuestionnaire ? (
          <div className="@lg:flex items-center justify-center h-full">
            <Button asChild type="default">
              <Link
                href={`/org/${slug}/billing?panel=subscriptionPlan&source=securityQuestionnaire`}
              >
                Upgrade to Team
              </Link>
            </Button>
          </div>
        ) : (
          <div className="@lg:flex items-center justify-center h-full">
            <Button
              type="default"
              icon={<Download />}
              onClick={handleDownloadClick}
              disabled={!slug}
            >
              Download Questionnaire
            </Button>
          </div>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
