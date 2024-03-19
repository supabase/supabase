import { useRef } from 'react'
import { Button, IconArrowLeft, IconArrowRight, IconGitHubSolid } from 'ui'
import Link from 'next/link'

import SectionContainer from '../Layouts/SectionContainer'
import ExampleCard from '../ExampleCard'
import { CTA } from '../../types/common'
import { Swiper, SwiperSlide } from 'swiper/react'
// import Swiper core and required modules
import SwiperCore, { Navigation, Pagination } from 'swiper'

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
  const prevRef = useRef(null)
  const nextRef = useRef(null)

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
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onInit={(swiper: any) => {
            swiper.params.navigation.prevEl = prevRef.current
            swiper.params.navigation.nextEl = nextRef.current
            swiper.navigation.update()
          }}
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
              <SwiperSlide key={i}>
                <div className="">
                  <ExampleCard i={i} {...example} />
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
        <div className="container mx-auto mt-3 hidden flex-row justify-between md:flex">
          <div ref={prevRef} className="p ml-4 cursor-pointer">
            <IconArrowLeft />
          </div>
          <div ref={nextRef} className="p mr-4 cursor-pointer">
            <IconArrowRight />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamplesCarousel
