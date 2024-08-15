import Table from 'components/to-be-cleaned/Table'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Button, IconMoreHorizontal } from 'ui'

const UsersListItemSkeleton = () => {
  return (
    <Table.tr className="relative">
      <Table.td className="whitespace-nowrap">
        <ShimmeringLoader className="h-[20px] py-0 w-8" />
      </Table.td>
      <Table.td className="whitespace-nowrap">
        <ShimmeringLoader className="h-[20px] py-0 w-36" />
      </Table.td>
      <Table.td className="whitespace-nowrap">
        <ShimmeringLoader className="h-[20px] py-0 w-8" />
      </Table.td>
      <Table.td className="table-cell">
        <ShimmeringLoader className="h-[20px] py-0 w-10" />
      </Table.td>
      <Table.td className="table-cell">
        <ShimmeringLoader className="h-[20px] py-0 w-32" />
      </Table.td>
      <Table.td className="table-cell">
        <ShimmeringLoader className="h-[20px] py-0 w-8" />
      </Table.td>
      <Table.td className="table-cell">
        <ShimmeringLoader className="h-[20px] py-0 w-20" />
      </Table.td>
      <Table.td className="table-cell">
        <Button type="text" disabled={true} className="hover:border-muted flex">
          <IconMoreHorizontal />
        </Button>
      </Table.td>
    </Table.tr>
  )
}

export default UsersListItemSkeleton
