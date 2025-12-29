import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { BASE_PATH } from 'lib/constants'
import { Badge, Button } from 'ui'
import { Admonition } from 'ui-patterns'

interface AlphaNoticeProps {
  entity: string
  feedbackUrl: string
  className?: string
}

export const AlphaNotice = ({ entity, feedbackUrl, className }: AlphaNoticeProps) => {
  return (
    <Admonition
      showIcon={false}
      type="tip"
      layout="horizontal"
      actions={
        <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />} className="mt-2">
          <Link target="_blank" rel="noopener noreferrer" href={feedbackUrl}>
            Share feedback
          </Link>
        </Button>
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
        <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2">
        <div className="flex flex-col gap-y-0.5">
          <div className="flex flex-col gap-y-2 items-start">
            <Badge variant="success" className="-ml-0.5">
              New
            </Badge>
            <p className="text-sm font-medium">Introducing {entity.toLocaleLowerCase()}</p>
          </div>
          <p className="text-sm text-foreground-lighter text-balance">
            {entity} {entity.endsWith('s') ? 'are' : 'is'} now in private alpha. Expect rapid
            changes, limited features, and possible breaking updates. Please share feedback as we
            refine the experience and expand access.
          </p>
        </div>
      </div>
    </Admonition>
  )
}
