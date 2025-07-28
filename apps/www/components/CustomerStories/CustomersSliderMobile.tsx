import 'swiper/css'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'

import { cn } from 'ui'
import { CompositionCol } from '.'
import type { CompositionColType } from '.'

interface Props {
  className?: string
  columns: CompositionColType[]
}

const CustomersSliderMobile: React.FC<Props> = ({ columns, className }) => (
  <div className={className}>
    <Swiper
      initialSlide={0}
      spaceBetween={12}
      slidesPerView="auto"
      speed={400}
      watchOverflow
      threshold={2}
      updateOnWindowResize
      allowTouchMove
      className="!px-6 w-full h-full overflow-visible"
    >
      {columns.map((column: CompositionColType, i: number) => (
        <SwiperSlide
          className={cn(
            'flex w-full !h-full',
            column.type === 'expanded' ? 'w-full max-w-[450px]' : '!w-[250px]'
          )}
          key={`${column.cards[0].organization}-mobile-customer-${i}`}
        >
          <CompositionCol
            className={cn(
              'flex flex-col w-full !h-full gap-3',
              column.type === 'expanded' ? 'w-full' : 'w-[250px]'
            )}
            column={column}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
)

export default CustomersSliderMobile
