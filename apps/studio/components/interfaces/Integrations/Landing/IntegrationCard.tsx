import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Badge, cn } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { IntegrationDefinition } from './Integrations.constants'

type IntegrationCardProps = IntegrationDefinition & {
  isInstalled?: boolean
}

const INTEGRATION_CARD_STYLE = cn(
  'w-full h-full pl-5 pr-6 py-3 bg-surface-100 hover:bg-surface-200 hover:border-strong',
  'border border-border gap-3 rounded-md inline-flex ease-out duration-200 transition-all'
)

export const IntegrationLoadingCard = () => {
  return (
    <div className={cn(INTEGRATION_CARD_STYLE, 'h-[110px]')}>
      <div className="w-10 h-10 relative">
        <ShimmeringLoader className="w-full h-full bg-white border rounded-md" />
      </div>
      <div className="grow basis-0 w-full flex flex-col justify-between items-start gap-y-2">
        <div className="flex-col justify-start items-start gap-y-1 flex">
          <ShimmeringLoader className="w-20 py-2.5" />
          <ShimmeringLoader className="w-56 py-2.5" />
        </div>
      </div>
    </div>
  )
}

export const IntegrationCard = ({
  id,
  status,
  name,
  icon,
  description,
  isInstalled,
}: IntegrationCardProps) => {
  const { project } = useProjectContext()

  return (
    <Link href={`/project/${project?.ref}/integrations/${id}/overview`}>
      <div className={INTEGRATION_CARD_STYLE}>
        <div className="w-10 h-10 relative bg-white border rounded-md flex items-center justify-center">
          {icon()}
        </div>
        <div className="grow basis-0 w-full flex flex-col justify-between items-start gap-y-2 relative">
          <div className="flex-col justify-start items-start gap-y-0.5 flex">
            <div className="flex items-center gap-x-2">
              <p className="text-foreground text-sm">{name}</p>
              {status && (
                <Badge variant="warning" className="py-0 px-1.5 capitalize">
                  {status}
                </Badge>
              )}
            </div>
            <p className="text-foreground-light text-xs">{description}</p>
          </div>
          <div className="flex items-center gap-x-4">
            <Badge className="bg-opacity-100 bg-surface-300 flex items-center gap-x-1.5">
              <span>Official</span>
            </Badge>
            {isInstalled && (
              <div className="flex items-center gap-x-1">
                <BadgeCheck size={14} className="text-brand-600" />
                <span className=" text-brand-600 text-xs">Installed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
