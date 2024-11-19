import Image from 'next/image'
import Link from 'next/link'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Badge, cn } from 'ui'
import { IntegrationDefinition } from './Integrations.constants'

type IntegrationCardProps = IntegrationDefinition & {}

export const IntegrationCard = ({ id, name, icon, description }: IntegrationCardProps) => {
  const { project } = useProjectContext()

  return (
    <Link href={`/project/${project?.ref}/integrations/${id}`}>
      <div
        className={cn([
          'w-80 h-28 pl-5 pr-6 py-3 bg-surface-100 hover:bg-surface-200 hover:border-strong ',
          'border border-border gap-3 rounded-md',
          'inline-flex ease-out duration-200 transition-all',
        ])}
      >
        <div className="w-10 h-10 relative">
          <div className="w-full h-full bg-white border rounded-md" />
          <Image fill src={icon} alt={`${name}`} className="p-2" />
        </div>
        <div className="grow basis-0 w-full flex flex-col justify-between items-start gap-0">
          <div className="flex-col justify-start items-start gap-0 flex">
            <div className="text-foreground text-sm">{name}</div>
            <div className="text-foreground-light text-xs">{description}</div>
          </div>
          <Badge className="bg-surface-400">Official</Badge>
        </div>
      </div>
    </Link>
  )
}
