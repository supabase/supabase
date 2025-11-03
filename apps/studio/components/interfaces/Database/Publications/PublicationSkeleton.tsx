import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Switch, TableCell, TableRow } from 'ui'

export interface PublicationSkeletonProps {
  index?: number
}

export const PublicationSkeleton = ({ index }: PublicationSkeletonProps) => {
  return (
    <TableRow>
      <TableCell style={{ width: '35%' }}>
        <ShimmeringLoader className="h-4 w-24 my-0.5 p-0" delayIndex={index} />
      </TableCell>
      <TableCell className="hidden lg:table-cell" style={{ width: '15%' }}>
        <ShimmeringLoader className="h-4 w-14 my-0.5 p-0" delayIndex={index} />
      </TableCell>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableCell key={i}>
          <Switch size="small" checked={false} disabled={true} />
        </TableCell>
      ))}
      <TableCell className="px-4 py-3 pr-2">
        <div className="flex justify-end">
          <ShimmeringLoader className="h-6 w-12 p-0" delayIndex={index} />
        </div>
      </TableCell>
    </TableRow>
  )
}
