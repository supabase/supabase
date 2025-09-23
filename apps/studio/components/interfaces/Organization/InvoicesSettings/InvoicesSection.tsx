import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import InvoicesSettings from './InvoicesSettings'

const InvoicesSection = () => {
  const { isSuccess: isPermissionsLoaded, can: canReadInvoices } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12 pr-6">
          <p className="text-foreground text-base m-0">Past Invoices</p>

          <p className="prose text-sm">
            You get an invoice every time you change your plan or when your monthly billing cycle
            resets.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {isPermissionsLoaded && !canReadInvoices ? (
          <NoPermission resourceText="view this organization's upcoming invoice" />
        ) : (
          <InvoicesSettings />
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default InvoicesSection
