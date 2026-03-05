import 'swiper/css'

import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, cn } from 'ui'
import Link from 'next/link'
import { CTA } from '~/types/common'

import ExampleCard from '~/components/ExampleCard'
import { Swiper, SwiperSlide } from 'swiper/react'
// import Swiper core and required modules
import SwiperCore from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'

// install Swiper modules
SwiperCore.use([Navigation, Pagination])

const ExamplesCarousel = ({
  title,
  cta,
  examples,
}: {
  title: string | React.ReactNode
  cta: CTA
  examples: any[]
}) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperCore | null>(null)

  return (
    <div id="examples" className="container">
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <h3 className="h2 !mb-0">{title}</h3>
        {cta && (
          <Button asChild type="default" size="tiny">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        )}
      </div>
      <div className="mt-8 lg:mt-10">
        <Swiper
          style={{ overflow: 'visible' }}
          loop={true}
          initialSlide={0}
          spaceBetween={10}
          slidesPerView={3}
          autoplay={{
            delay: 2400,
          }}
          speed={300}
          onSwiper={setSwiperInstance}
          breakpoints={{
            320: {
              slidesPerView: 1.1,
              spaceBetween: 10,
            },
            720: {
              slidesPerView: 2,
              spaceBetween: 10,
            },
            920: {
              slidesPerView: 3,
              spaceBetween: 10,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
          }}
        >
          {Object.values(examples).map((example: any, i: number) => {
            return (
              <SwiperSlide key={example.title}>
                <ExampleCard i={i} {...example} />
              </SwiperSlide>
            )
          })}
        </Swiper>
        <div className="container mx-auto mt-3 hidden flex-row justify-between md:flex">
          <button onClick={() => swiperInstance?.slidePrev()} className={cn('p ml-4 cursor-pointer')}>
            <ArrowLeft />
            <span className="sr-only">Slide previous</span>
          </button>
          <button onClick={() => swiperInstance?.slideNext()} className="p mr-4 cursor-pointer">
            <ArrowRight />
            <span className="sr-only">Slide next</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExamplesCarousel
