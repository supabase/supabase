import type { CSSProperties } from 'react'
import { Card, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export interface ShimmeringLoader {
  className?: string
  style?: CSSProperties
  delayIndex?: number
  animationDelay?: number
}

export const ShimmeringLoader = ({
  className,
  style,
  delayIndex = 0,
  animationDelay = 150,
}: ShimmeringLoader) => {
  return (
    <div
      className={cn('shimmering-loader rounded py-3', className)}
      style={{
        ...style,
        animationFillMode: 'backwards',
        animationDelay: `${delayIndex * animationDelay}ms`,
      }}
    />
  )
}

interface GenericSkeletonLoaderProps {
  className?: string
}

export const GenericSkeletonLoader = ({ className }: GenericSkeletonLoaderProps) => (
  <div className={cn(className, 'space-y-2')}>
    <ShimmeringLoader />
    <ShimmeringLoader className="w-3/4" />
    <ShimmeringLoader className="w-1/2" />
  </div>
)

export const GenericTableLoader = ({
  headers = [],
  numRows = 3,
}: {
  headers?: (string | null)[]
  numRows?: number
}) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.length === 0 ? (
              <TableHead />
            ) : (
              headers.map((h, i) => <TableHead key={`${h}_${i}`}>{h}</TableHead>)
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {new Array(numRows).fill(0).map((_, i) => (
            <TableRow key={`row_${i}`}>
              <TableCell colSpan={headers.length}>
                <ShimmeringLoader />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export default ShimmeringLoader
