import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { InvoicesSettings } from './InvoicesSettings'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export const InvoicesSection = () => {
  const { isSuccess: isPermissionsLoaded, can: canReadInvoices } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.ORGANIZATION.BILLING_READ
  )

  return (
    <PageSection orientation="horizontal">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Past Invoices</PageSectionTitle>
          <PageSectionDescription>
            You get an invoice every time you change your plan or when your monthly billing cycle
            resets.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="flex flex-col gap-6">
        {isPermissionsLoaded && !canReadInvoices ? (
          <NoPermission resourceText="view this organization's upcoming invoice" />
        ) : (
          <InvoicesSettings />
        )}
      </PageSectionContent>
    </PageSection>
  )
}
