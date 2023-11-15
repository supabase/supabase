import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSelectedOrganization } from 'hooks'
import { useParams } from 'common'

const ProjectBillingUsage: NextPageWithLayout = () => {
  // This component is only used for redirects, as nextjs cant redirect based on hash
  const router = useRouter()
  const { ref } = useParams()
  const organization = useSelectedOrganization()

  const hash = router.asPath.split('#')[1]
  const route = router.route

  useEffect(() => {
    if (!organization) return

    let redirectUrl

    if (['cpu', 'ram', 'disk_io'].includes(hash)) {
      redirectUrl = `/project/${ref}/settings/infrastructure#${hash}`
    } else {
      redirectUrl = `/org/${organization.slug}/usage?projectRef=${ref}`
    }

    router.push(redirectUrl)
  }, [hash, route, organization, ref, router])

  return null
}

ProjectBillingUsage.getLayout = (page) => <SettingsLayout title="Usage">{page}</SettingsLayout>

export default ProjectBillingUsage
