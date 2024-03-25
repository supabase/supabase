import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import { jsonSyntaxHighlight, SelectionDetailedRow } from '../LogsFormatters'

const DefaultExplorerSelectionRenderer = ({ log }: any) => {
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
        <span className="text-foreground-lighter text-sm col-span-4">{label}</span>
        <span
          className={`text-foreground text-sm col-span-8 overflow-x-auto ${
            code && 'text-xs font-mono'
          }`}
        >
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
          <div
            key={`${key}-${index}`}
            className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}
          >
            {value && typeof value === 'object' ? (
              <DetailedJsonRow label={key} value={value} />
            ) : (
              <SelectionDetailedRow label={key} value={value === null ? 'NULL ' : String(value)} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DefaultExplorerSelectionRenderer
