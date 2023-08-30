import { useRef } from 'react'

import { useRouter } from 'next/router'

import { Swiper, SwiperSlide } from 'swiper/react'
// import Swiper core and required modules
import SwiperCore, { Navigation, Pagination } from 'swiper'

import { Button, IconMessageCircle, IconArrowLeft, IconArrowRight } from 'ui'

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
          <h3 className="h2">Join the community</h3>
          <p className="p">
            Supported by a network of early advocates, contributors, and champions.
          </p>
          <div className="my-8 flex justify-center gap-2">
            <Link href={'https://github.com/supabase/supabase/discussions'} passHref>
              <a target="_blank" tabIndex={-1}>
                <Button size="small" iconRight={<IconMessageCircle size={14} />} type="default">
                  GitHub discussions
                </Button>
              </a>
            </Link>
            <Link href={'https://discord.supabase.com/'} passHref>
              <a target="_blank" tabIndex={-1}>
                <Button type="default" size="small" iconRight={<IconMessageCircle size={14} />}>
                  Discord
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="cursor-move lg:-mr-32 lg:-ml-32">
          <Swiper
            loop={true}
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
                  <div className="mr-3 ml-3 mt-1">
                    <Link href={tweet.url}>
                      <a
                        target="_blank"
                        className="block cursor-pointer focus:outline-none focus:border-none focus:ring-brand-600 focus:ring-2 focus:rounded-2xl"
                      >
                        <TweetCard
                          key={i}
                          handle={`@${tweet.handle}`}
                          quote={tweet.text}
                          img_url={`${basePath}${tweet.img_url}`}
                        />
                      </a>
                    </Link>
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

export default TwitterSocialProof
