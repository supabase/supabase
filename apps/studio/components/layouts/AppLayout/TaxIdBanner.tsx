import { LOCAL_STORAGE_KEYS } from 'common'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useRouter } from 'next/router'

import { TAX_IDS } from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/TaxID.constants'
import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink } from '@/components/ui/InlineLink'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const SUPPORTED_TAX_ID_COUNTRIES = new Set(TAX_IDS.map((t) => t.countryIso2))

export const TaxIdBanner = () => {
  const router = useRouter()
  const { data: org } = useSelectedOrganizationQuery()
  const slug = org?.slug

  const [isDismissed, setIsDismissed, { isSuccess: isDismissLoaded }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TAX_ID_BANNER_DISMISSED(slug ?? ''),
    false
  )

  const shouldFetch =
    !!slug &&
    org?.plan?.id !== 'free' &&
    isDismissLoaded &&
    !isDismissed &&
    !!org?.organization_missing_tax_id

  const { data: customerProfile } = useOrganizationCustomerProfileQuery(
    { slug },
    { enabled: shouldFetch, staleTime: 1000 * 60 * 30 }
  )

  const billingCountry = customerProfile?.address?.country
  const hasSupportedTaxId = !!billingCountry && SUPPORTED_TAX_ID_COUNTRIES.has(billingCountry)

  if (
    router.pathname.includes('sign-in') ||
    !org ||
    org.plan?.id === 'free' ||
    !isDismissLoaded ||
    isDismissed ||
    !org.organization_missing_tax_id ||
    !hasSupportedTaxId
  ) {
    return null
  }

  return (
    <HeaderBanner
      variant="note"
      title="Missing tax ID"
      description={
        <>
          Registered businesses should{' '}
          <InlineLink href={`/org/${slug}/billing#address`}>add a tax ID</InlineLink> to their
          billing details
        </>
      }
      onDismiss={() => setIsDismissed(true)}
    />
  )
}
