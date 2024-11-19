import Link from 'next/link'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { cn } from 'ui'
import { IntegrationDefinition } from './Integrations.constants'

type IntegrationCardProps = IntegrationDefinition & {}

export const IntegrationCard = ({ id, name, icon, description }: IntegrationCardProps) => {
  const { project } = useProjectContext()

  return (
    <Link href={`/project/${project?.ref}/integrations/${id}`}>
      <div
        className={cn([
          'w-80 h-28 pl-5 pr-6 py-3 bg-surface-100 hover:bg-surface-300 ',
          'border border-border gap-3 rounded-md',
          'inline-flex ease-out duration-200 transition-all',
        ])}
      >
        <div className="w-10 h-10 relative">
          <div className="w-full h-full bg-foreground rounded-md" />
          {icon}
        </div>
        <div className="grow basis-0 w-full">
          <div className="flex-col justify-start items-start gap-1 flex">
            <div className="text-foreground text-sm">{name}</div>
            <div className="text-foreground-light text-xs">{description}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
