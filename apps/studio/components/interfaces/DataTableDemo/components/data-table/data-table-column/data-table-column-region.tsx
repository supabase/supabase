import { regions } from 'components/interfaces/DataTableDemo/constants/region'

interface DataTableColumnRegionProps {
  value: string
  showFlag?: boolean
  reverse?: boolean
}

export function DataTableColumnRegion({
  value,
  showFlag = false,
  reverse = false,
}: DataTableColumnRegionProps) {
  const region = regions[value] ?? { label: value, flag: '' }
  return reverse ? (
    <>
      <span className="text-xs text-muted-foreground">
        {showFlag && region.flag} {region.label}
      </span>{' '}
      <span>{value}</span>
    </>
  ) : (
    <>
      <span>{value}</span>{' '}
      <span className="text-xs text-muted-foreground">
        {showFlag && region.flag} {region.label}
      </span>
    </>
  )
}
