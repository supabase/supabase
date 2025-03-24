import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useShowLayoutHeader } from 'hooks/misc/useShowLayoutHeader'
import { useNewLayout } from 'hooks/ui/useNewLayout'
import { IS_PLATFORM } from 'lib/constants'

export const HomeIcon = () => {
  const newLayoutPreview = useNewLayout()
  const showLayoutHeader = useShowLayoutHeader()
  const selectedOrganization = useSelectedOrganization()
  const { data: organizations } = useOrganizationsQuery()
  const { project } = useProjectContext()

  const router = useRouter()

  if (!showLayoutHeader && !newLayoutPreview) return null

  const getDefaultOrgRedirect = () => {
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
