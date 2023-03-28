import { NextRouter, useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconExternalLink, IconHelpCircle } from 'ui'

import { BaseReportParams } from './Reports.types'
import { LogsEndpointParams } from '../Settings/Logs'
import Panel from 'components/ui/Panel'
import LoadingOpacity from 'components/ui/LoadingOpacity'

export interface ReportWidgetProps<T = any> {
  data: T[]
  title: string
  description?: string
  tooltip?: string
  className?: string
  renderer: (props: ReportWidgetRendererProps) => React.ReactNode
  params: BaseReportParams | LogsEndpointParams
  isLoading: boolean
}

export interface ReportWidgetRendererProps extends ReportWidgetProps {
  router: NextRouter
  projectRef: string
}

const ReportWidget: React.FC<ReportWidgetProps> = (props) => {
  const router = useRouter()
  const { ref } = router.query
  const projectRef = ref as string

  return (
    <Panel
      noMargin
      noHideOverflow
      className={'pb-0 ' + props.className}
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
                    <IconHelpCircle className="text-scale-1100" size="tiny" strokeWidth={1.5} />
                  </Tooltip.Trigger>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 max-w-xs leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">{props.tooltip}</span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Root>
              )}
            </div>
            <p className="text-sm text-scale-1100">{props.description}</p>
          </div>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Button
                type="default"
                icon={<IconExternalLink strokeWidth={1.5} />}
                className="px-1"
                onClick={() => {
                  router.push({
                    pathname: `/project/${projectRef}/logs/explorer`,
                    query: {
                      q: props.params?.sql,
                      its: props.params.iso_timestamp_start,
                      ite: props.params.iso_timestamp_end,
                    },
                  })
                }}
              />
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 max-w-xs leading-none shadow',
                  'border border-scale-200',
                ].join(' ')}
              >
                <span className="text-xs text-scale-1200">Open in Logs Explorer</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>

        <LoadingOpacity className="w-full" active={props.isLoading}>
          {props.data === undefined ? null : props.renderer({ ...props, router, projectRef })}
        </LoadingOpacity>
      </Panel.Content>
    </Panel>
  )
}

export default ReportWidget
