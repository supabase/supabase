import { useParams } from 'common'
import Link from 'next/link'

import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useState } from 'react'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import ConfirmDisableReadOnlyModeModal from './DatabaseSettings/ConfirmDisableReadOnlyModal'
import { AlertTriangle, ExternalLink } from 'lucide-react'

export const DatabaseReadOnlyAlert = () => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const { data: resourceWarnings } = useResourceWarningsQuery()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  const isReadOnlyMode =
    (resourceWarnings ?? [])?.find((warning) => warning.project === projectRef)
      ?.is_readonly_mode_enabled ?? false

  return (
    <>
      {isReadOnlyMode && (
        <Alert_Shadcn_ variant="destructive">
          <AlertTriangle />
          <AlertTitle_Shadcn_>
            Project is in read-only mode and database is no longer accepting write requests
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            You have reached 95% of your project's disk space, and read-only mode has been enabled
            to preserve your database's stability and prevent your project from exceeding its
            current billing plan. To resolve this, you may:
            <ul className="list-disc pl-6 mt-1">
              <li>
                Temporarily disable read-only mode to free up space and reduce your database size
              </li>
              {subscription?.plan.id === 'free' ? (
                <li>
                  <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                    <a className="text underline">Upgrade to the Pro Plan</a>
                  </Link>{' '}
                  to increase your database size limit to 8GB.
                </li>
              ) : subscription?.plan.id === 'pro' && subscription?.usage_billing_enabled ? (
                <li>
                  <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                    <a className="text-foreground underline">Disable your Spend Cap</a>
                  </Link>{' '}
                  to allow your project to auto-scale and expand beyond the 8GB database size limit
                </li>
              ) : null}
            </ul>
          </AlertDescription_Shadcn_>
          <div className="mt-4 flex items-center space-x-2">
            <Button type="default" onClick={() => setShowConfirmationModal(true)}>
              Disable read-only mode
            </Button>
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                href="https://supabase.com/docs/guides/platform/database-size#disabling-read-only-mode"
                target="_blank"
                rel="noreferrer"
              >
                Learn more
              </a>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
      <ConfirmDisableReadOnlyModeModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
      />
    </>
  )
}
