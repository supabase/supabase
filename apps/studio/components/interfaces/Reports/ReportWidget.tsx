import * as Tooltip from '@radix-ui/react-tooltip'
import { ExternalLink, HelpCircle } from 'lucide-react'
import { NextRouter, useRouter } from 'next/router'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { Button, Loading, cn } from 'ui'
import { LogsEndpointParams } from '../Settings/Logs'
import type { BaseReportParams, ReportQueryType } from './Reports.types'

export interface ReportWidgetProps<T = any> {
  data: T[]
  title: string
  description?: string
  tooltip?: string
  className?: string
  renderer: (props: ReportWidgetRendererProps) => React.ReactNode
  append?: (props: ReportWidgetRendererProps) => React.ReactNode
  // for overriding props, such as data
  appendProps?: Partial<ReportWidgetRendererProps>
  // omitting params will hide the "View in logs explorer" button
  params?: BaseReportParams | LogsEndpointParams
  queryType?: ReportQueryType
  isLoading: boolean
  resolvedSql?: string
}

export interface ReportWidgetRendererProps<T = any> extends ReportWidgetProps<T> {
  router: NextRouter
  projectRef: string
}

const ReportWidget = (props: ReportWidgetProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const projectRef = ref as string

  return (
    <Panel
      noMargin
      noHideOverflow
      className={cn('pb-0', props.className)}
      bodyClassName="h-full"
      wrapWithLoading={false}
    >
      <Panel.Content className="space-y-4">
        <div className="flex flex-row items-start justify-between">
          <div className="gap-2">
            <div className="flex flex-row gap-2">
              <h3 className="w-full h-6">{props.title}</h3>{' '}
              {props?.tooltip && (
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <HelpCircle className="text-foreground-light" size={14} />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 max-w-xs leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">{props.tooltip}</span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              )}
            </div>
            <p className="text-sm text-foreground-light">{props.description}</p>
          </div>
          {props.params && (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  type="default"
                  icon={<ExternalLink />}
                  className="px-1"
                  onClick={() => {
                    const isDbQueryType = props.queryType === 'db'

                    const pathname = isDbQueryType
                      ? `/project/${projectRef}/sql/new`
                      : `/project/${projectRef}/logs/explorer`

                    const query: Record<string, string | undefined> = {}

                    if (isDbQueryType) {
                      query.content = props.resolvedSql
                    } else {
                      query.q = props.params?.sql
                      query.its = props.params!.iso_timestamp_start
                      query.ite = props.params!.iso_timestamp_end
                    }

                    router.push({ pathname, query })
                  }}
                />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 max-w-xs leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      {props.queryType === 'db' ? 'Open in SQL Editor' : 'Open in Logs Explorer'}
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
        </div>

        <Loading active={props.isLoading}>
          {props.data === undefined ? null : props.renderer({ ...props, router, projectRef })}
        </Loading>
      </Panel.Content>

      {props.append && (
        <>{props.append({ ...props, ...(props.appendProps || {}), router, projectRef })}</>
      )}
    </Panel>
  )
}

export default ReportWidget
