import Usage from 'components/interfaces/BillingV2/Usage/Usage'
import { SettingsLayout } from 'components/layouts'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useParams } from 'common'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const ProjectBillingUsage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id
  const router = useRouter()
  const hash = router.asPath.split('#')[1]

  useEffect(() => {
    if (ref && isOrgBilling && organization) {
      let redirectUri = `/org/${organization.slug}/usage?projectRef=${ref}`

      if (['cpu', 'ram', 'disk_io'].includes(hash)) {
        redirectUri = `/project/${ref}/settings/infrastructure#${hash}`
      } else if (hash && hash.length > 0) {
        redirectUri = redirectUri + `#${hash}`
      }

      router.push(redirectUri)
    }
  }, [organization, isOrgBilling, ref, hash])

  if (isOrgBilling) {
    return null
  }

  return <Usage />
}

ProjectBillingUsage.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default ProjectBillingUsage
