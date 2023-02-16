import { Button, Dropdown, IconMoreVertical } from 'ui'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import Panel from 'components/ui/Panel'
import { useRouter } from 'next/router'
import { BaseReportParams } from './Reports.types'
import { LogsEndpointParams } from '../Settings/Logs'
import * as Tooltip from '@radix-ui/react-tooltip'
import { IconHelpCircle } from '@supabase/ui'

export interface ReportWidgetProps<T = any> {
  data: T[]
  title: string
  description?: string
  tooltip?: string
  className?: string
  renderer: (props: ReportWidgetProps) => React.ReactNode
  params: BaseReportParams | LogsEndpointParams
  isLoading: boolean
}

const ReportWidget: React.FC<ReportWidgetProps> = (props) => {
  const router = useRouter()
  const { ref } = router.query
  return (
    <Panel
      noMargin
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
                  <IconHelpCircle className="text-scale-900" size="tiny" />
                </Tooltip.Trigger>
                <Tooltip.Content side="top">
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
          <Dropdown
            align="end"
            overlay={
              <>
                <Dropdown.Item
                  onClick={() => {
                    router.push({
                      pathname: `/project/${ref}/logs/explorer`,
                      query: {
                        q: props.params?.sql,
                        its: props.params.iso_timestamp_start,
                        ite: props.params.iso_timestamp_end,
                      },
                    })
                  }}
                >
                  Open in Logs Explorer
                </Dropdown.Item>
              </>
            }
            side="bottom"
          >
            <Button
              title="Actions..."
              as="span"
              type="text"
              icon={<IconMoreVertical className="text-scale-1000" size="tiny" />}
            ></Button>
          </Dropdown>
        </div>

        <LoadingOpacity active={props.isLoading}>{props.renderer(props)}</LoadingOpacity>
      </Panel.Content>
    </Panel>
  )
}

export default ReportWidget
