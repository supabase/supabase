import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import { jsonSyntaxHighlight } from '../LogsFormatters'

const DefaultSelectionRenderer = ({ log }: any) => {
  const DetailedRow = ({
    label,
    value,
    code,
  }: {
    label: string
    value: string | React.ReactNode
    code?: boolean
  }) => {
    return (
      <div className="grid grid-cols-12">
        <span className="text-scale-900 text-sm col-span-4">{label}</span>
        <span className={`text-scale-1200 text-sm col-span-8 ${code && 'text-xs font-mono'}`}>
          {value}
        </span>
      </div>
    )
  }

  const DetailedJsonRow = ({
    label,
    value,
    code,
  }: {
    label: string
    value: Object
    code?: boolean
  }) => {
    return (
      <div className="grid grid-cols-12">
        <span className="text-scale-900 text-sm col-span-4">{label}</span>
        <span className={`text-scale-1200 text-sm col-span-8 ${code && 'text-xs font-mono'}`}>
          <pre
            dangerouslySetInnerHTML={{
              __html: jsonSyntaxHighlight(value),
            }}
          />
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-hidden overflow-x-auto space-y-6">
      {Object.entries(log).map(([key, value], index) => {
        return (
          <div key={`${key}-${index}`} className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
            {value && typeof value === 'object' ? (
              <DetailedJsonRow label={key} value={value} />
            ) : (
              <DetailedRow label={key} value={String(value)} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DefaultSelectionRenderer
