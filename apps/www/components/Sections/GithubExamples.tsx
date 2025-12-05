import { useState } from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
// import Swiper core and required modules
import SwiperCore from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'

import { Github } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import Examples from '~/data/Examples'
import ExampleCard from '../ExampleCard'

// install Swiper modules
SwiperCore.use([Navigation, Pagination])

function GithubExamples() {
  const [swiperInstance, setSwiperInstance] = useState<SwiperCore | null>(null)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <h2 className="h3">Community driven examples, libraries and guides</h2>
          <p className="p ">
            Supported by a network of early advocates, contributors, and champions.
          </p>
          <div className="flex items-center justify-center gap-2 py-4">
            <Button asChild size="small" type="default" icon={<BookOpen size={12} />}>
              <Link href="/docs/guides/resources/examples">View guides</Link>
            </Button>
            <Button asChild size="small" type="default" icon={<Github size={12} />}>
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
            onSwiper={setSwiperInstance}
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
              <button onClick={() => swiperInstance?.slidePrev()} className="p ml-4 cursor-pointer">
                <ArrowLeft />
                <span className="sr-only">Slide previous</span>
              </button>
              <button onClick={() => swiperInstance?.slideNext()} className="p mr-4 cursor-pointer">
                <ArrowRight />
                <span className="sr-only">Slide next</span>
              </button>
            </div>
          </Swiper>
        </div>
      </div>
    </>
  )
}

export default GithubExamples
