import { ChevronRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

import { useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { cn } from 'ui'

interface ExampleProjectProps {
  title: string
  description: string
  url: string
  framework?: string
  iconUrl?: string
}

export const ExampleProject = ({
  framework,
  title,
  description,
  url,
  iconUrl,
}: ExampleProjectProps) => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()
  const iconImgSrc = iconUrl
    ? iconUrl
    : !!framework
      ? `${BASE_PATH}/img/libraries/${framework.toLowerCase()}${
          ['expo', 'nextjs'].includes(framework.toLowerCase())
            ? resolvedTheme?.includes('dark')
              ? '-dark'
              : ''
            : ''
        }-icon.svg`
      : ''

  return (
    <Link
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        sendEvent({
          action: 'example_project_card_clicked',
          properties: { cardTitle: title },
          groups: { project: projectRef ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
      }
    >
      <div
        className={cn(
          'group relative',
          'border bg-surface-100 border-overlay',
          'flex h-32 flex-row rounded-md p-4 hover:bg-overlay-hover',
          'transition duration-150 ease-in-out'
        )}
      >
        <div className="mr-4 flex flex-col">
          <img
            className="transition-all group-hover:scale-110"
            src={iconImgSrc}
            alt={`${framework} logo`}
            width={26}
            height={26}
          />
        </div>
        <div className="w-4/5 space-y-2">
          <h5 className="text-foreground">{title}</h5>
          <p className="text-sm text-foreground-light">{description}</p>
        </div>
        <div
          className={cn(
            'absolute right-4 top-3',
            'text-foreground-lighter transition-all duration-200',
            'group-hover:right-3 group-hover:text-foreground'
          )}
        >
          <ChevronRight />
        </div>
      </div>
    </Link>
  )
}
