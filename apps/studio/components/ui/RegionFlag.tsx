import type { ImgHTMLAttributes } from 'react'
import { cn } from 'ui'

import { BASE_PATH } from '@/lib/constants'

interface RegionFlagProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  region: string
}

export const RegionFlag = ({ alt = '', className, region, ...props }: RegionFlagProps) => (
  <img
    alt={alt}
    className={cn('border border-default', className)}
    src={`${BASE_PATH}/img/regions/${region}.svg`}
    {...props}
  />
)
