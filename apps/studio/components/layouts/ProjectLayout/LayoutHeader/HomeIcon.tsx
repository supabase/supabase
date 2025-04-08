import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useShowLayoutHeader } from 'hooks/misc/useShowLayoutHeader'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'

export const HomeIcon = () => {
  const newLayoutPreview = useNewLayout()
  const showLayoutHeader = useShowLayoutHeader()
  const selectedOrganization = useSelectedOrganization()
  const { data: organizations } = useOrganizationsQuery()
  const { project } = useProjectContext()

  const router = useRouter()
  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  if (!showLayoutHeader && !newLayoutPreview) return null

  const getDefaultOrgRedirect = () => {
    if (lastVisitedOrganization) return `/org/${lastVisitedOrganization}`
    if (selectedOrganization?.slug) return `/org/${selectedOrganization.slug}`
    if (organizations && organizations.length > 0) return `/org/${organizations[0].slug}`
    return '/projects'
  }

  const href = newLayoutPreview
    ? IS_PLATFORM
      ? getDefaultOrgRedirect()
      : `/project/${project?.ref}`
    : '/projects'

  return (
    <Link href={href} className="items-center justify-center flex-shrink-0 hidden md:flex">
      <Image
        alt="Supabase"
        src={`${router.basePath}/img/supabase-logo.svg`}
        width={18}
        height={18}
        className="w-[18px] h-[18px]"
      />
    </Link>
  )
}
