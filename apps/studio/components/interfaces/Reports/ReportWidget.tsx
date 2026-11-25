import { type AnyRouter, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { ExternalLinkIcon, HelpCircleIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Button, cn, Loading, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { LogsEndpointParams } from '../Settings/Logs/Logs.types'
import type { BaseReportParams, ReportQueryType } from './Reports.types'
import Panel from '@/components/ui/Panel'

export interface ReportWidgetProps<T = any> {
  data: T[]
  title: string
  description?: string
  error?: string | Object | null
  tooltip?: string | ReactNode
  className?: string
  contentClassName?: string
  headerClassName?: string
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
  projectRef: string
}

const ReportWidget = (props: ReportWidgetProps) => {
  const navigate = useNavigate()
  const { ref } = useParams()
  const projectRef = ref as string

  return (
    <Panel noMargin noHideOverflow className={cn('pb-0', props.className)} wrapWithLoading={false}>
      <Panel.Content className={cn('space-y-4', props.contentClassName)}>
        <div className={cn('flex flex-row items-start justify-between', props.headerClassName)}>
          <div className="gap-2">
            <div className="flex flex-row gap-2">
              <h3 className="w-full h-6">{props.title}</h3>{' '}
              {props?.tooltip && (
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircleIcon className="text-foreground-light" size={14} strokeWidth={1.5} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{props.tooltip}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-sm text-foreground-light">{props.description}</p>
          </div>
          {props.params && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  icon={<ExternalLinkIcon />}
                  className="px-1"
                  onClick={() => {
                    const isDbQueryType = props.queryType === 'db'
                    const to = isDbQueryType
                      ? `/project/${projectRef}/sql/new`
                      : `/project/${projectRef}/logs/explorer`
                    const search: Record<string, string | undefined> = isDbQueryType
                      ? { content: props.resolvedSql }
                      : {
                          q: props.params?.sql,
                          its: props.params?.iso_timestamp_start || '',
                          ite: props.params?.iso_timestamp_end || '',
                        }
                    navigate<AnyRouter, string>({ to, search })
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="left">
                {props.queryType === 'db' ? 'Open in SQL Editor' : 'Open in Logs Explorer'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Loading active={props.isLoading}>
          {props.data === undefined
            ? null
            : props.renderer({ ...props, projectRef: projectRef as string })}
        </Loading>
      </Panel.Content>

      {props.append && (
        <>
          {props.append({
            ...props,
            ...(props.appendProps || {}),
            projectRef: projectRef as string,
          })}
        </>
      )}
    </Panel>
  )
}

export default ReportWidget
