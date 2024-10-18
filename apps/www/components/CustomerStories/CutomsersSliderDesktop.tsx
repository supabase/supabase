import React from 'react'
import { range } from 'lodash'
import { cn } from 'ui'

import { CompositionCol } from '.'
import type { CompositionColType } from '.'

interface Props {
  className?: string
  columns: CompositionColType[]
}

const compositionGap = 'gap-4'

const CutomsersSliderDesktop: React.FC<Props> = ({ columns, className }) => (
  <div
    className={cn(
      'group/tw-marquee w-full items-stretch h-[300px] min-w-[300px] nowrap mb-16 md:mb-24 lg:mb-24',
      compositionGap,
      className
    )}
  >
    {range(0, 2).map((_, idx1: number) => (
      <div
        key={`row-${idx1}`}
        className={cn(
          'relative',
          'left-0 z-10',
          'w-auto h-full',
          'flex gap-4 items-end',
          'motion-safe:run motion-safe:animate-[marquee_50000ms_linear_both_infinite] group-hover/tw-marquee:pause',
          'will-change-transform transition-transform',
          compositionGap
        )}
      >
        {columns.map((column, idx2) => (
          <CompositionCol
            key={`customers-col-${idx1}-${idx2}`}
            className={cn(
              'flex flex-col !h-full',
              compositionGap,
              column.type === 'expanded' ? 'w-[450px]' : 'w-[250px]'
            )}
            column={column}
          />
        ))}
      </div>
    ))}
  </div>
)

export default CutomsersSliderDesktop
