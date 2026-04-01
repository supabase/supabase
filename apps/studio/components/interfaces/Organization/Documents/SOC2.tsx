import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const SOC2 = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug

  const { mutate: sendEvent } = useSendEventMutation()
  const { can: canReadSubscriptions, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )
  const { hasAccess: hasAccessToSoc2Report, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('security.soc2_report')

  const [isOpen, setIsOpen] = useState(false)

  const fetchSOC2 = async (orgSlug: string) => {
    try {
      const soc2Link = await getDocument({ orgSlug, docType: 'soc2-type-2-report' })
      if (soc2Link?.fileUrl) window.open(soc2Link.fileUrl, '_blank')
      setIsOpen(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to download SOC2 report: ${message}`)
    }
  }

  const handleDownloadClick = () => {
    if (!slug) return

    sendEvent({
      action: 'document_view_button_clicked',
      properties: { documentName: 'SOC2' },
      groups: { organization: slug },
    })
    setIsOpen(true)
  }

  return (
    <ScaffoldSection className="py-12">
      <ScaffoldSectionDetail>
        <h4 className="mb-5">SOC2 Type 2</h4>
        <div className="space-y-2 text-sm text-foreground-light [&_p]:m-0">
          <p>
            Organizations on Team Plan or above have access to our most recent SOC2 Type 2 report.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {isLoadingPermissions || isLoadingEntitlement ? (
          <div className="@lg:flex items-center justify-center h-full">
            <ShimmeringLoader className="w-24" />
          </div>
        ) : !canReadSubscriptions ? (
          <NoPermission resourceText="access our SOC2 Type 2 report" />
        ) : !hasAccessToSoc2Report ? (
          <div className="@lg:flex items-center justify-center h-full">
            <Button asChild type="default">
              <Link href={`/org/${slug}/billing?panel=subscriptionPlan&source=soc2`}>
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
              Download SOC2 Type 2 Report
            </Button>
          </div>
        )}
        <ConfirmationModal
          visible={isOpen}
          size="large"
          title="Non-Disclosure Agreement to access Supabase's SOC2 Report"
          confirmLabel="I agree"
          confirmLabelLoading="Downloading"
          onCancel={() => setIsOpen(false)}
          onConfirm={() => {
            if (slug) fetchSOC2(slug)
          }}
        >
          <ol className="list-decimal list-inside text-sm text-foreground-light pl-30">
            <li>The information that you are about to access is confidential.</li>
            <li>
              Your access to our SOC 2 materials is governed by confidentiality obligations
              contained in the agreement between Supabase, Inc ("Supabase", "we", "our" or "us") and
              the Supabase customer that has authorized you to access our platform to obtain this
              information (our "Customer").
            </li>
            <li>
              You must ensure that you treat the information in our SOC 2 materials in accordance
              with those confidentiality obligations, as communicated to you by the Customer.
            </li>
            <li>
              By clicking "I agree" below or otherwise accessing our SOC 2 materials, you:
              <ol className="list-[lower-roman] list-inside pl-4">
                <li>acknowledge that you have read and understood this Confidentiality Notice;</li>
                <li>
                  confirm that you have been authorized by the Customer to access this information,
                  and your use of our SOC 2 materials is subject to the confidentiality obligations
                  owed by the Customer to us.
                </li>
              </ol>
            </li>
            <li>
              This Confidentiality Notice does not substitute or supersede any agreement between us
              and the Customer, or any internal rules or policies that the Customer requires you to
              comply with in your access to and use of confidential information. However, your
              failure to comply with this Confidentiality Notice may be used to determine whether
              the Customer has complied with its confidentiality obligations to us.
            </li>
          </ol>
        </ConfirmationModal>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
