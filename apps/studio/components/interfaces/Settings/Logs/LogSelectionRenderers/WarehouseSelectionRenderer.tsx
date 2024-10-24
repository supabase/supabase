import { cn } from 'ui'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import { jsonSyntaxHighlight, SelectionDetailedRow } from '../LogsFormatters'

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
      <span className="text-foreground-lighter text-sm col-span-3">{label}</span>
      <span
        className={cn(
          'text-foreground text-sm col-span-9 overflow-x-auto',
          code && 'text-xs font-mono'
        )}
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

export const WarehouseSelectionRenderer = ({ log }: any) => {
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
