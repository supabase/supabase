import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { METRICS } from 'lib/constants/metrics'
import { ReactNode } from 'react'
import { ReportBlockContainer } from './ReportBlockContainer'

interface DeprecatedChartBlockProps {
  label: string
  attribute: string
  actions?: ReactNode
}

export const DeprecatedChartBlock = ({ label, attribute, actions }: DeprecatedChartBlockProps) => {
  const { ref } = useParams()
  const metric = METRICS.find((x) => x.key === attribute)

  const logsName = metric?.category?.label

  const getLogsUrl = (logsName?: string) => {
    switch (logsName) {
      case 'Database API':
        return '/logs/postgrest-logs'
      case 'All API usage':
        return '/logs/explorer'
      case 'Realtime':
        return '/logs/realtime-logs'
      case 'Storage':
        return '/logs/storage-logs'
      case 'Authentication':
        return '/logs/auth-logs'
      default:
        return ''
    }
  }

  return (
    <ReportBlockContainer
      draggable
      showDragHandle
      loading={false}
      icon={metric?.category?.icon('text-foreground-muted')}
      label={label}
      actions={actions}
    >
      <div className="flex flex-col justify-center flex-1">
        <p className="text-xs text-foreground-lightr">
          This chart is not longer available, and can be removed from your report
        </p>
        <p className="text-xs text-foreground-lighter">
          You may view the equivalent of this data from the{' '}
          <InlineLink href={`/project/${ref}/${getLogsUrl(logsName)}`}>{logsName} Logs</InlineLink>{' '}
          instead
        </p>
      </div>
    </ReportBlockContainer>
  )
}
