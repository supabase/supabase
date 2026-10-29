import { AWS_REGIONS } from 'shared-data'
import { cn } from 'ui'

import { RegionFlag } from '@/components/ui/RegionFlag'

export const ReplicationRegionLabel = ({
  code,
  className,
}: {
  code: string
  className?: string
}) => {
  const region = Object.values(AWS_REGIONS).find((region) => region.code === code)

  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-2', className)}>
      {region && <RegionFlag className="w-4 shrink-0" region={region.code} />}
      <span className="min-w-0 break-words">{region?.displayName ?? code}</span>
    </span>
  )
}
