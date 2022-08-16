import { render } from '@headlessui/react/dist/utils/render'
import { Button, Dropdown, IconMoreVertical } from '@supabase/ui'
import { Misc } from '@supabase/ui/dist/cjs/components/Menu/Menu'
import Loading from 'components/ui/Loading'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import Panel from 'components/ui/Panel'
import { useRouter } from 'next/router'
import { LogsEndpointParams } from '../Settings/Logs'

export interface ReportWidgetProps {
  data: any[]
  title: string
  description: string
  className?: string
  renderer: (props: ReportWidgetProps) => React.ReactNode
  params: LogsEndpointParams
  isLoading: boolean
}

const ReportWidget: React.FC<ReportWidgetProps> = (props) => {
  const router = useRouter()
  const { ref } = router.query
  return (
    <Panel className={'pb-0 ' + props.className} bodyClassName="h-full" wrapWithLoading={false}>
      <Panel.Content className="space-y-4">
        <div className="flex flex-row justify-between items-start">
          <div className="gap-2">
            <h3>{props.title}</h3>
            <p className="text-sm text-scale-1100">{props.description}</p>
          </div>
          <Dropdown
            align="end"
            overlay={[
              <Dropdown.Item
                onClick={() => {
                  router.push({
                    pathname: `/project/${ref}/logs-explorer`,
                    query: {
                      q: props.params.sql,
                      its: props.params.iso_timestamp_start,
                      ite: props.params.iso_timestamp_end,
                    },
                  })
                }}
              >
                Open in Logs Explorer
              </Dropdown.Item>,
            ]}
            side="bottom"
          >
            <Button
              title="Actions..."
              as="span"
              type="text"
              icon={<IconMoreVertical className="text-scale-1100" size="small" />}
            ></Button>
          </Dropdown>
        </div>

        <LoadingOpacity active={props.isLoading}>{props.renderer(props)}</LoadingOpacity>
      </Panel.Content>
    </Panel>
  )
}

export default ReportWidget
