import { ExternalLink, HelpCircle } from 'lucide-react'
import { NextRouter, useRouter } from 'next/router'
import { ReactNode } from 'react'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import {
  Button,
  Loading,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import type { LogsEndpointParams } from '../Settings/Logs/Logs.types'
import type { BaseReportParams, ReportQueryType } from './Reports.types'

export interface ReportWidgetProps<T = any> {
  data: T[]
  title: string
  description?: string
  error?: string | Object | null
  tooltip?: string
  className?: string
  renderer: (props: ReportWidgetRendererProps) => ReactNode
  append?: (props: ReportWidgetRendererProps) => ReactNode
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
    <Panel noMargin noHideOverflow className={cn('pb-0', props.className)} wrapWithLoading={false}>
      <Panel.Content className="space-y-4">
        <div className="flex flex-row items-start justify-between">
          <div className="gap-2">
            <div className="flex flex-row gap-2">
              <h3 className="w-full h-6">{props.title}</h3>{' '}
              {props?.tooltip && (
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_>
                    <HelpCircle className="text-foreground-light" size={14} strokeWidth={1.5} />
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="bottom">{props.tooltip}</TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              )}
            </div>
            <p className="text-sm text-foreground-light">{props.description}</p>
          </div>
          {props.params && (
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
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
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="left">
                {props.queryType === 'db' ? 'Open in SQL Editor' : 'Open in Logs Explorer'}
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          )}
        </div>

        <Loading active={props.isLoading}>
          {props.data === undefined
            ? null
            : props.renderer({ ...props, router, projectRef: projectRef as string })}
        </Loading>
      </Panel.Content>

      {props.append && (
        <>
          {props.append({
            ...props,
            ...(props.appendProps || {}),
            router,
            projectRef: projectRef as string,
          })}
        </>
      )}
    </Panel>
  )
}

export default ReportWidget
