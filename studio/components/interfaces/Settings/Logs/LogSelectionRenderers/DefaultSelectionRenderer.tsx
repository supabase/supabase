import Table from 'components/to-be-cleaned/Table'
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
      {/* <Table
        className={`bg-scale-300 ${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}
        body={
          <>
            {Object.entries(log).map(([key, value]) => (
              <Table.tr key={key} className="!bg-scale-300">
                <Table.th className="flex pt-4 text-sm font-normal font-sans text-scale-1100">
                  {key}
                </Table.th>
                <Table.td className="">
                  <pre className="text-xs  p-2">
                    {value && typeof value === 'object' ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: jsonSyntaxHighlight(value),
                        }}
                      />
                    ) : (
                      <span className="text-sm text-scale-1200 font-sans font-normal">
                        {String(value)}
                      </span>
                    )}
                  </pre>
                </Table.td>
              </Table.tr>
            ))}
          </>
        }
      /> */}
      {Object.entries(log).map(([key, value]) => {
        return (
          <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
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
