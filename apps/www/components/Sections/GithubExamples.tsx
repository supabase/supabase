import { useRef } from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
// import Swiper core and required modules
import SwiperCore from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'

import Link from 'next/link'
import { Button, IconGitHub, IconArrowLeft, IconArrowRight, IconBookOpen } from 'ui'

import Examples from '~/data/Examples'
import ExampleCard from '../ExampleCard'

// install Swiper modules
SwiperCore.use([Navigation, Pagination])

function GithubExamples() {
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <h2 className="h3">Community driven examples, libraries and guides</h2>
          <p className="p ">
            Supported by a network of early advocates, contributors, and champions.
          </p>
          <div className="flex items-center justify-center gap-2 py-4">
            <Button asChild size="small" type="default" icon={<IconBookOpen size={12} />}>
              <Link href="/docs/guides/resources/examples">View guides</Link>
            </Button>
            <Button asChild size="small" type="default" icon={<IconGitHub size={12} />}>
              <Link
                href="https://github.com/supabase/supabase/tree/master/examples"
                as="https://github.com/supabase/supabase/tree/master/examples"
              >
                Official GitHub library
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className={'lg:-mr-32 lg:-ml-32'}>
          <Swiper
            style={{ overflow: 'visible' }}
            loop={true}
            initialSlide={3}
            spaceBetween={0}
            slidesPerView={4}
            autoplay={{
              delay: 2400,
            }}
            speed={300}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
              // prevEl: prevRef.current ? prevRef.current : undefined,
              // nextEl: nextRef.current ? nextRef.current : undefined,
            }}
            onInit={(swiper: any) => {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
              swiper.navigation.update()
            }}
            breakpoints={{
              320: {
                slidesPerView: 1,
              },
              720: {
                slidesPerView: 2,
              },
              920: {
                slidesPerView: 3,
              },
              1024: {
                slidesPerView: 4,
              },
            }}
          >
            {Object.values(Examples).map((example: any, i: number) => {
              return (
                <SwiperSlide key={i}>
                  <div className="my-8 mr-3 ml-3">
                    <ExampleCard i={i} {...example} />
                  </div>
                </SwiperSlide>
              )
            })}
            <div className="container mx-auto mt-3 hidden flex-row justify-between md:flex">
              <div ref={prevRef} className="p ml-4 cursor-pointer">
                <IconArrowLeft />
              </div>
              <div ref={nextRef} className="p mr-4 cursor-pointer">
                <IconArrowRight />
              </div>
            </div>
          </Swiper>
        </div>
      </div>
    </>
  )
}

export default GithubExamples
