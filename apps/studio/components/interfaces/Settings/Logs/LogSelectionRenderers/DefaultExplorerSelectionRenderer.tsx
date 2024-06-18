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
      <div className="flex gap-2 flex-wrap">
        <span className="text-foreground-lighter text-sm col-span-3">{label}</span>
        <span
          className={`text-foreground text-sm col-span-9 overflow-x-auto ${
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
          <div key={`${key}-${index}`} className="px-4 pb-4">
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
