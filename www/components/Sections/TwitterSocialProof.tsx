import { useRef } from 'react'

import { useRouter } from 'next/router'

import { Swiper, SwiperSlide } from 'swiper/react'
// import Swiper core and required modules
import SwiperCore, { Navigation, Pagination } from 'swiper'

import {
  Button,
  Typography,
  IconMessageCircle,
  Space,
  IconAlignLeft,
  IconArrowLeft,
  IconArrowRight,
} from '@supabase/ui'

import Examples from '../../data/tweets/Tweets.json'
import TweetCard from '../TweetCard'

// Import Swiper styles
import 'swiper/swiper.min.css'
import 'swiper/components/navigation/navigation.min.css'
import 'swiper/components/pagination/pagination.min.css'
import Link from 'next/link'

// install Swiper modules
SwiperCore.use([Navigation, Pagination])

function TwitterSocialProof() {
  // base path for images
  const { basePath } = useRouter()

  const prevRef = useRef(null)
  const nextRef = useRef(null)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <Typography.Title level={2}>Join the community</Typography.Title>
          <Typography.Text>
            <p className="lg:text-lg">
              Supported by a network of early advocates, contributors, and champions.
            </p>
            <div className="my-4">
              <Link
                href={'https://github.com/supabase/supabase/discussions'}
                as={'https://github.com/supabase/supabase/discussions'}
              >
                <a className="block text-sm text-gray-400 dark:text-gray-400 mt-3" target="_blank">
                  <Button size="small" iconRight={<IconMessageCircle size="tiny" />} type="default">
                    GitHub discussions
                  </Button>
                </a>
              </Link>
            </div>
          </Typography.Text>
        </div>
      </div>
      <div className="mt-6">
        <div className={'lg:-mr-32 lg:-ml-32'}>
          <Swiper
            initialSlide={3}
            spaceBetween={0}
            slidesPerView={4}
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
              // swiper.navigation.update()
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
              1208: {
                slidesPerView: 5,
              },
            }}
          >
            {Examples.map((tweet: any, i: number) => {
              return (
                <SwiperSlide key={i}>
                  <div className="mr-3 ml-3 cursor-move">
                    <TweetCard
                      key={i}
                      handle={`@${tweet.handle}`}
                      quote={tweet.text}
                      img_url={`${basePath}${tweet.img_url}`}
                    />
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

export default TwitterSocialProof
