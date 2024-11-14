import { useParams } from 'common'
import { OverviewTab } from 'components/interfaces/Integrations/Integration/OverviewTab'
import { WrappersTab } from 'components/interfaces/Integrations/Integration/WrappersTab'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import type { NextPageWithLayout } from 'types'
import { NavMenu, NavMenuItem } from 'ui'

const LandingPage: NextPageWithLayout = () => {
  const { id } = useParams()
  const { project } = useProjectContext()
  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (!integration) {
    return null
  }

  return (
    <div className="py-8">
      <Link
        href={`/project/${project?.ref}/integrations/landing`}
        className="flex flex-row items-center gap-1 pl-10 text-foreground-light"
      >
        <ChevronLeft size={14} />
        <span className="text-sm  hover:underline">Integrations</span>
      </Link>
      <div className="flex flex-row pl-10"></div>
      <div className="pl-10 pt-5 flex flex-row gap-4">
        <div className="w-12 h-12 relative">
          <div className="w-full h-full bg-foreground rounded-md" />
          <Image fill src={integration.icon} alt={`${integration.name}`} className="p-2" />
        </div>
        <div className="grow basis-0 w-full">
          <div className="flex-col justify-start items-start flex">
            <div className="text-white text-lg">{integration.name}</div>
            <div className="text-foreground-light text-sm">{integration.description}</div>
          </div>
        </div>
      </div>

      <NavMenu className="pl-10 mt-9" aria-label="Vault menu">
        <NavMenuItem active={selectedTab === 'overview'}>
          <Link href={`/project/${project?.ref}/integrations/${id}?tab=overview`}>Overview</Link>
        </NavMenuItem>
        <NavMenuItem active={selectedTab === 'wrappers'}>
          <Link href={`/project/${project?.ref}/integrations/${id}?tab=wrappers`}>Wrappers</Link>
        </NavMenuItem>
        <NavMenuItem active={selectedTab === 'logs'}>
          <Link href={`/project/${project?.ref}/integrations/${id}?tab=logs`}>Logs</Link>
        </NavMenuItem>
      </NavMenu>
      <div className="p-9">
        {selectedTab === 'overview' && <OverviewTab integration={integration} />}
        {selectedTab === 'wrappers' && <WrappersTab />}
      </div>
      {selectedTab === 'logs' && <div className="p-10">This tab hasn't been done yet</div>}
    </div>
  )
}

LandingPage.getLayout = (page) => {
  return (
    <ProjectLayout title={'Integrations'} product="Integrations" isBlocking={false}>
      {page}
    </ProjectLayout>
  )
}

export default LandingPage
