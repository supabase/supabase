import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { Button, cn } from 'ui'
import { LOG_DRAIN_TYPES } from 'components/interfaces/LogDrains/LogDrains.constants'
import { Admonition } from 'ui-patterns'

export const ObservabilityBanner = () => (
  <Admonition showIcon={false} type="tip" className="relative overflow-hidden">
    <div className="absolute -inset-16 z-0 opacity-50">
      <img
        src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
        alt="Background pattern"
        className="w-full h-full object-cover object-right hidden dark:block"
      />
      <img
        src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
        alt="Background pattern"
        className="w-full h-full object-cover object-right dark:hidden"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
    </div>
    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2 py-1">
      <div className="flex flex-col gap-y-0.5">
        <div className="flex flex-col gap-y-2 items-start">
          <div className="flex items-center gap-4 mb-2">
            {LOG_DRAIN_TYPES.map((type) =>
              React.cloneElement(type.icon, { height: 20, width: 20 })
            )}
          </div>
          <p className="text-sm font-medium">Advanced observability</p>
        </div>
        <p className="text-sm text-foreground-lighter text-balance">
          Visualize over 200 database performance and health metrics with our Metrics API.
        </p>
      </div>
      <ObservabilityBannerActions />
    </div>
  </Admonition>
)

const ObservabilityBannerActions = ({ className }: { className?: string }) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div className={cn('flex gap-2', className)}>
      <Button type="default" size="tiny" icon={<BookOpen />} asChild>
        <Link
          href={`${DOCS_URL}/guides/telemetry/metrics`}
          target="_blank"
          onClick={() =>
            sendEvent({
              action: 'reports_database_grafana_banner_clicked',
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }
        >
          Docs
        </Link>
      </Button>
      {/* <Button type="default" size="tiny" asChild>
        <Link
          href="https://github.com/supabase/supabase-grafana"
          target="_blank"
          onClick={() =>
            sendEvent({
              action: 'reports_database_grafana_banner_clicked',
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }
        >
          Configure Grafana
        </Link>
      </Button> */}
    </div>
  )
}
