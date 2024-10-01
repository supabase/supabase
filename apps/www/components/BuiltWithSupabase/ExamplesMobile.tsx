import 'swiper/css'

import React, { FC } from 'react'
import { useRouter } from 'next/router'
import { Swiper, SwiperSlide } from 'swiper/react'
import ExampleCard from '../ExampleCard'

import content from '~/data/home/content'
import type { Example } from 'data/Examples'

interface Props {
  examples: Example[]
  className?: string
}

const ExamplesMobile: FC<Props> = ({ examples, className }: any) => {
  const { basePath } = useRouter()

  return (
    <div className={className}>
      <Swiper
        style={{ zIndex: 0, marginRight: '1px' }}
        initialSlide={0}
        spaceBetween={12}
        slidesPerView={1.1}
        speed={300}
        watchOverflow
        threshold={2}
        updateOnWindowResize
        className="!px-6 w-full overflow-visible"
        breakpoints={{
          320: {
            slidesPerView: 1.1,
          },
          540: {
            slidesPerView: 1.6,
          },
          720: {
            slidesPerView: 2.5,
          },
        }}
      >
        {examples.map((example: Example, i: number) => (
          <SwiperSlide key={`${content}-${i}`}>
            <ExampleCard {...example} showProducts />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ExamplesMobile
