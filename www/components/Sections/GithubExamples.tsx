import { useRef } from 'react'

import { useRouter } from 'next/router'

import { Swiper, SwiperSlide } from 'swiper/react'
// import Swiper core and required modules
import SwiperCore, { Navigation, Pagination } from 'swiper'

import Link from 'next/link'
import {
  Button,
  Typography,
  IconGitHub,
  IconArrowLeft,
  IconArrowRight,
  Space,
  IconBookOpen,
} from '@supabase/ui'

import Examples from '../../data/Examples.json'
import ExampleCard from '../ExampleCard'

// install Swiper modules
SwiperCore.use([Navigation, Pagination])

function GithubExamples() {
  // base path for images
  const { basePath } = useRouter()

  const prevRef = useRef(null)
  const nextRef = useRef(null)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <Typography.Title level={2}>
            Community driven examples, libraries and guides
          </Typography.Title>
          <Typography.Text className="block mb-6">
            <p className="text-base lg:text-lg">
              Supported by a network of early advocates, contributors, and champions.
            </p>
          </Typography.Text>
          <div className="flex space-y-1.5 flex-col lg:space-y-0 lg:space-x-1.5 lg:flex-row justify-center">
            <Link
              href="https://supabase.io/docs/guides/examples#guides"
              as="https://supabase.io/docs/guides/examples#guides"
            >
              <a>
                <Button type="default" icon={<IconBookOpen />}>
                  View guides
                </Button>
              </a>
            </Link>
            <Link
              href="https://supabase.io/docs/guides/examples"
              as="https://supabase.io/docs/guides/examples"
            >
              <a>
                <Button type="default">View all examples</Button>
              </a>
            </Link>
            <Link
              href="https://github.com/supabase/supabase/tree/master/examples"
              as="https://github.com/supabase/supabase/tree/master/examples"
            >
              <a>
                <Button type="default" icon={<IconGitHub />}>
                  Official GitHub library
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className={'lg:-mr-32 lg:-ml-32'}>
          <Swiper
            style={{ overflow: 'visible' }}
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
            <div className="container mx-auto hidden md:flex flex-row justify-between mt-3">
              <div ref={prevRef} className="cursor-pointer">
                <Typography.Text>
                  <IconArrowLeft />
                </Typography.Text>
              </div>
              <div ref={nextRef} className="cursor-pointer">
                <Typography.Text>
                  <IconArrowRight />
                </Typography.Text>
              </div>
            </div>
          </Swiper>
        </div>
      </div>
    </>
  )
}

export default GithubExamples
