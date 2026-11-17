import type { ComponentProps } from 'react'

import { cn } from '../../lib/utils/cn'

export type SplitButtonGroupProps = ComponentProps<'div'>

export const SplitButtonGroup = ({ className, ...props }: SplitButtonGroupProps) => (
  <div role="group" className={cn('flex raised-control-group', className)} {...props} />
)
