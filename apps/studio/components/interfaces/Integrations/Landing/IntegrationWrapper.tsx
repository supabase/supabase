import { IntegrationDefinition } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { ReactNode } from 'react'
import { NavMenu, NavMenuItem } from 'ui'

// This is not defined as a true layout because it requires specific props.
export const IntegrationWrapper = ({
  integration,
  tabs,
}: {
  integration: IntegrationDefinition
  tabs: { id: string; label: string; content: ReactNode }[]
}) => {
  const { project } = useProjectContext()
  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

  return (
    <div className="py-8 h-full">
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
          {integration.icon}
        </div>
        <div className="grow basis-0 w-full">
          <div className="flex-col justify-start items-start flex">
            <div className="text-white text-lg">{integration.name}</div>
            <div className="text-foreground-light text-sm">{integration.description}</div>
          </div>
        </div>
      </div>

      <NavMenu className="pl-10 mt-9">
        {tabs.map((tab) => {
          return (
            <NavMenuItem active={selectedTab === tab.id}>
              <Link href={`/project/${project?.ref}/integrations/${integration.id}?tab=${tab.id}`}>
                {tab.label}
              </Link>
            </NavMenuItem>
          )
        })}
      </NavMenu>
      {tabs.find((t) => t.id === selectedTab)?.content}
    </div>
  )
}
