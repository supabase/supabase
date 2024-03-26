import Table from 'components/to-be-cleaned/Table'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Toggle } from 'ui'

export interface PublicationSkeletonProps {
  index?: number
}

const PublicationSkeleton = ({ index }: PublicationSkeletonProps) => {
  return (
    <Table.tr className="border-t">
      <Table.td className="px-4 py-3" style={{ width: '25%' }}>
        <ShimmeringLoader className="h-4 w-24 my-0.5 p-0" delayIndex={index} />
      </Table.td>
      <Table.td className="hidden lg:table-cell" style={{ width: '25%' }}>
        <ShimmeringLoader className="h-4 w-14 my-0.5 p-0" delayIndex={index} />
      </Table.td>
      {Array.from({ length: 4 }).map((_, i) => (
        <Table.td key={i}>
          <Toggle size="tiny" checked={false} disabled={true} />
        </Table.td>
      ))}
      <Table.td className="px-4 py-3 pr-2">
        <div className="flex justify-end">
          <ShimmeringLoader className="h-6 w-12 p-0" delayIndex={index} />
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default PublicationSkeleton
