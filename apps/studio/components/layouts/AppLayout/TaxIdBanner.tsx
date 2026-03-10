import { LOCAL_STORAGE_KEYS } from 'common'
import { useRouter } from 'next/router'

import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink } from '@/components/ui/InlineLink'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'

export const TaxIdBanner = () => {
  const router = useRouter()
  const { data: org } = useSelectedOrganizationQuery()
  const slug = org?.slug

  const [isDismissed, setIsDismissed, { isSuccess: isDismissLoaded }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TAX_ID_BANNER_DISMISSED(slug ?? ''),
    false
  )

  const { data: taxId, isSuccess: isTaxIdLoaded } = useOrganizationTaxIdQuery(
    { slug },
    {
      enabled: !!slug && org?.plan?.id !== 'free' && !isDismissed,
      staleTime: 1000 * 60 * 30,
    }
  )

  if (
    router.pathname.includes('sign-in') ||
    !org ||
    org.plan?.id === 'free' ||
    !isTaxIdLoaded ||
    !isDismissLoaded ||
    taxId ||
    isDismissed
  ) {
    return null
  }

  return (
    <HeaderBanner
      variant="note"
      title="Add a Tax ID to your organization"
      description={
        <>
          If you are a registered business, please{' '}
          <InlineLink href={`/org/${slug}/billing#address`}>add a Tax ID</InlineLink> to your
          billing settings. Not applicable for individual users.
        </>
      }
      onDismiss={() => setIsDismissed(true)}
    />
  )
}
