import type { ImgHTMLAttributes } from 'react'

import { BASE_PATH } from '@/lib/constants'

interface RegionFlagProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  region: string
}

export const RegionFlag = ({
  alt = '',
  'aria-hidden': ariaHidden,
  className,
  region,
  ...props
}: RegionFlagProps) => (
  <img
    alt={alt}
    aria-hidden={ariaHidden ?? alt === ''}
    className={`rounded-xs border border-foreground-muted/20 ${className ?? ''}`}
    src={`${BASE_PATH}/img/regions/${region}.svg`}
    {...props}
  />
)
