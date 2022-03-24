import Table from 'components/to-be-cleaned/Table'
import { jsonSyntaxHighlight } from '../LogsFormatters'

const DefaultSelectionRenderer = ({ log }: any) => {
  return (
    <Table
      body={
        <>
          {Object.entries(log).map(([key, value]) => (
            <Table.tr key={key}>
              <Table.th className="text-xs">{key}</Table.th>
              <Table.td>
                <pre className="text-xs  p-2">
                  {value && typeof value === 'object' ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: jsonSyntaxHighlight(value),
                      }}
                    />
                  ) : (
                    String(value)
                  )}
                </pre>
              </Table.td>
            </Table.tr>
          ))}
        </>
      }
    />
  )
}

export default DefaultSelectionRenderer
