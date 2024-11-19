import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { getDocument } from 'data/documents/document-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const SOC2 = () => {
  const { slug } = useParams()
  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug }, { enabled: canReadSubscriptions })
  const currentPlan = subscription?.plan

  const [isOpen, setIsOpen] = useState(false)

  const fetchSOC2 = async (orgSlug: string) => {
    try {
      const soc2Link = await getDocument({ orgSlug, docType: 'soc2-type-2-report' })
      if (soc2Link?.fileUrl) window.open(soc2Link.fileUrl, '_blank')
      setIsOpen(false)
    } catch (error: any) {
      toast.error(`Failed to download SOC2 report: ${error.message}`)
    }
  }

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail className="sticky space-y-6 top-12">
        <p className="text-base m-0">SOC2 Type 2</p>
        <div className="space-y-2 text-sm text-foreground-light m-0">
          <p>
            Organizations on Team Plan or above have access to our most recent SOC2 Type 2 report.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadSubscriptions ? (
          <NoPermission resourceText="access our SOC2 Type 2 report" />
        ) : (
          <>
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
                    <Button type="default">Upgrade to Team</Button>
                  </Link>
                ) : (
                  <Button type="default" icon={<Download />} onClick={() => setIsOpen(true)}>
                    Download SOC2 Type 2 Report
                  </Button>
                )}
              </div>
            )}
          </>
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

export default SOC2
