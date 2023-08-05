import SubscriptionV2 from 'components/interfaces/BillingV2/Subscription/Subscription'
import { SettingsLayout } from 'components/layouts'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const ProjectBilling: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id
  const router = useRouter()

  useEffect(() => {
    if (isOrgBilling) {
      const { ref, panel } = router.query
      let redirectUri = `/org/${organization.slug}/billing`
      switch (panel) {
        case 'subscriptionPlan':
          redirectUri = `/org/${organization.slug}/billing?panel=subscriptionPlan`
          break
        case 'costControl':
          redirectUri = `/org/${organization.slug}/billing?panel=costControl`
          break
        case 'computeInstance':
          redirectUri = `/project/${ref}/settings/addons?panel=computeInstance`
          break
        case 'pitr':
          redirectUri = `/project/${ref}/settings/addons?panel=pitr`
          break
        case 'customDomain':
          redirectUri = `/project/${ref}/settings/addons?panel=customDomain`
          break
      }

      router.push(redirectUri)
    }
  }, [router, organization?.slug, isOrgBilling])

  // No need to bother rendering, we'll redirect anyway
  if (isOrgBilling) {
    return null
  }

  return <SubscriptionV2 />
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default ProjectBilling
