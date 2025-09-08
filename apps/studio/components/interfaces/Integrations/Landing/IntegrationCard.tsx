import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { Badge, Card, CardContent, cn } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { IntegrationDefinition } from './Integrations.constants'

type IntegrationCardProps = IntegrationDefinition & {
  isInstalled?: boolean
  featured?: boolean
  image?: string
}

const INTEGRATION_CARD_STYLE = cn(
  'w-full h-full bg-surface-100 hover:bg-surface-200 hover:border-strong',
  'border border-border rounded-md ease-out duration-200 transition-all'
)

export const IntegrationLoadingCard = () => {
  return (
    <div className={cn(INTEGRATION_CARD_STYLE, 'pl-5 pr-6 py-3 gap-3 inline-flex h-[110px]')}>
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
  featured = false,
  image,
}: IntegrationCardProps) => {
  const { data: project } = useSelectedProjectQuery()

  if (featured) {
    return (
      <Link href={`/project/${project?.ref}/integrations/${id}/overview`} className="h-full">
        <Card className="h-full">
          {/* Full-width image/icon at the top */}
          <div className="w-full h-24 bg-surface-400 rounded-t-md flex items-center justify-center overflow-hidden relative">
            {image ? (
              <Image
                fill
                src={`${BASE_PATH}/${image}`}
                alt={`${name} integration`}
                className="w-full h-full object-cover invert dark:invert-0"
                objectFit="cover"
              />
            ) : (
              <div className="w-12 h-12 text-foreground relative">
                {icon({ className: 'w-full h-full text-foreground' })}
              </div>
            )}
          </div>
          <CardContent className="p-6 px-4">
            <div className="flex-col justify-start items-center text-center gap-y-0.5 flex">
              <h3>{name}</h3>
              <p className="text-foreground-light text-sm">{description}</p>
              <div className="flex items-center gap-x-1 mt-4">
                {status && (
                  <Badge variant="warning" className="capitalize">
                    {status}
                  </Badge>
                )}
                <Badge>
                  <span>Official</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/project/${project?.ref}/integrations/${id}/overview`} className="h-full">
      <Card className="h-full">
        <CardContent className="flex flex-col p-4 @2xl:p-6 h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="shrink-0 w-10 h-10 relative bg-white border rounded-md flex items-center justify-center">
              {icon()}
            </div>
            {isInstalled && (
              <div className="flex items-center gap-x-1">
                <BadgeCheck size={14} className="text-brand" />
                <span className=" text-brand text-xs">Installed</span>
              </div>
            )}
          </div>
          <div className="flex-col justify-start items-start gap-y-0.5 flex flex-1">
            <h3 className="text-foreground text-sm">{name}</h3>

            <p className="text-foreground-light text-xs flex-1">{description}</p>
            <div className="flex items-center gap-x-1 mt-4">
              {status && (
                <Badge variant="warning" className="capitalize">
                  {status}
                </Badge>
              )}
              <Badge>
                <span>Official</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
