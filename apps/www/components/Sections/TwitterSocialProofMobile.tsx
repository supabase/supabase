import 'swiper/css'

import { useRouter } from 'next/router'
import React, { FC } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { cn } from 'ui'
import { TweetCard } from 'ui-patterns/TweetCard'
import content from '~/data/home/content'
import Link from 'next/link'

interface Tweet {
  text: string
  url: string
  handle: string
  img_url: string
}

interface Props {
  tweets: Tweet[]
  className?: string
}

const TwitterSocialProofMobile: FC<Props> = ({ tweets, className }: any) => {
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
        className="h-[400px] !px-6 w-full overflow-visible"
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
        {tweets.map((tweet: any, i: number) => (
          <SwiperSlide key={`${content}-${i}`}>
            <Link
              key={tweet.text}
              href={tweet.url}
              target="_blank"
              className={cn('mb-4 z-0 break-inside-avoid-column block group')}
            >
              <TweetCard
                handle={`@${tweet.handle}`}
                quote={tweet.text}
                img_url={`${basePath}${tweet.img_url}`}
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default TwitterSocialProofMobile
