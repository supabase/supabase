import Table from 'components/to-be-cleaned/Table'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Toggle } from 'ui'

export interface SkeletonTableRowProps {
  index?: number
  columns: {
    key: string
    isToggle?: boolean
    width?: string
    align?: 'end'
  }[]
}

const SkeletonTableRow = ({ index, columns }: SkeletonTableRowProps) => {
  return (
    <Table.tr className="border-t">
      {columns.map((column, i) => (
        <Table.td
          key={column.key}
          className="px-4 py-3"
          style={column.width ? { width: column.width } : undefined}
        >
          {column.isToggle ? (
            <div className={`flex ${column.align === 'end' ? 'justify-end' : ''} gap-2`}>
              <Toggle size="tiny" checked={false} disabled={true} />
            </div>
          ) : (
            <div className={`flex ${column.align === 'end' ? 'justify-end' : ''}`}>
              <ShimmeringLoader
                className="h-4 w-24 my-0.5 p-0"
                delayIndex={index ? index + i : i}
              />
            </div>
          )}
        </Table.td>
      ))}
    </Table.tr>
  )
}

export default SkeletonTableRow
