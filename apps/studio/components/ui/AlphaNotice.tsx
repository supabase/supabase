import { LOCAL_STORAGE_KEYS } from 'common'
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { Badge, Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { BASE_PATH } from '@/lib/constants'

interface AlphaNoticeProps {
  entity: string
  feedbackUrl: string
  isCollapsible?: boolean
  className?: string
}

export const AlphaNotice = ({
  entity,
  feedbackUrl,
  isCollapsible = false,
  className,
  children,
}: PropsWithChildren<AlphaNoticeProps>) => {
  const [isCollapsed, setIsCollapsed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.ALPHA_NOTICE_COLLAPSED(entity),
    false
  )
  const isCollapsedView = isCollapsible && isCollapsed
  const title = `Introducing ${entity.toLocaleLowerCase()}`

  return (
    <Admonition
      showIcon={false}
      type="note"
      layout={isCollapsedView ? 'responsive' : 'horizontal'}
      actions={
        <div className={cn('flex items-center gap-x-2', !isCollapsedView && 'mt-2')}>
          <Button asChild icon={<ExternalLinkIcon strokeWidth={1.5} />}>
            <Link target="_blank" rel="noopener noreferrer" href={feedbackUrl}>
              Share feedback
            </Link>
          </Button>
          {isCollapsible && (
            <Button
              variant="text"
              className="px-1.5"
              aria-label={isCollapsed ? 'Expand notice' : 'Collapse notice'}
              aria-expanded={!isCollapsed}
              icon={isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
          )}
        </div>
      }
      className={className}
    >
      {/* Background image */}
      <div className="absolute -inset-16 z-0 opacity-50">
        <img
          src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
          alt="Supabase Grafana"
          className="w-full h-full object-cover object-right hidden dark:block"
        />
        <img
          src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
          alt="Supabase Grafana"
          className="w-full h-full object-cover object-right dark:hidden"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background-alternative to-transparent" />
      </div>

      {/* Content */}
      {isCollapsedView ? (
        <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 min-w-0">
          <Badge variant="success" className="shrink-0">
            New
          </Badge>
          <p className="text-sm font-medium shrink-0 mb-0!">{title}</p>
          <p className="text-sm text-foreground-lighter @md:truncate @md:min-w-0 @md:shrink">
            Private alpha. Expect rapid changes and limited features.
          </p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2">
          <div className="flex flex-col gap-y-0.5">
            <div className="flex flex-col gap-y-2 items-start">
              <Badge variant="success" className="-ml-0.5">
                New
              </Badge>
              <p className="text-sm font-medium">{title}</p>
            </div>
            <p className="text-sm text-foreground-lighter text-balance">
              {entity} {entity.endsWith('s') ? 'are' : 'is'} now in private alpha. Expect rapid
              changes, limited features, and possible breaking updates. Please share feedback as we
              refine the experience and expand access.
            </p>
            {children}
          </div>
        </div>
      )}
    </Admonition>
  )
}
