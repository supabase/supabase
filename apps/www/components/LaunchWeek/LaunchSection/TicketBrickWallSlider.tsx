import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { UserData } from '../Ticket/hooks/use-conf-data'
import { useWindowSize } from 'react-use'

import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Autoplay } from 'swiper'
import 'swiper/swiper.min.css'

SwiperCore.use([Autoplay])

interface Props {
  users: UserData[]
  reverse?: boolean
  speed?: number
}

export function TicketBrickWallSlider({ users, reverse, speed = 10000 }: Props) {
  const ref = useRef(null)
  const [swiperInstance, setSwiperInstance] = useState<SwiperCore | any | null>(null)
  const { width } = useWindowSize()
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7'
  const BUCKET_FOLDER_VERSION = 'v3'
  const getOgUrl = (username: string, isGold: boolean) =>
    `${STORAGE_URL}/tickets/gallery/${
      isGold ? 'golden' : 'regular'
    }/${BUCKET_FOLDER_VERSION}/${username}.png`

  useEffect(() => {
    // trigger autoplay if viewport resize
    if (swiperInstance) swiperInstance?.autoplay?.run()
  }, [width])

  return (
    <div ref={ref} className="relative h-auto w-full m-0 overflow-hidden mb-2.5">
      <div className="flex swiper-transition-linear">
        <Swiper
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          centeredSlides={true}
          spaceBetween={10}
          slidesPerView={5}
          speed={speed}
          loop={true}
          watchOverflow
          threshold={2}
          updateOnWindowResize
          allowTouchMove={false}
          autoplay={{
            delay: 0,
            disableOnInteraction: true,
            reverseDirection: reverse,
          }}
          breakpoints={{
            320: {
              slidesPerView: 2.5,
            },
            720: {
              slidesPerView: 3.5,
            },
            1440: {
              slidesPerView: 5,
            },
          }}
        >
          {users.map((user, i) => (
            <SwiperSlide key={user.username}>
              <Link href={`/launch-week/tickets/${user.username}`} key={user.username}>
                <a className="relative !w-[230px] md:w-[450px] !h-[200px] rounded-md md:rounded-lg transition-transform">
                  <div className="relative w-full pt-[50%] transform rounded-md md:rounded-lg overflow-hidden bg-gradient-to-b from-[#ffffff60] to-[#ffffff10]">
                    <div className="absolute inset-[1px] w-full h-full rounded-md md:rounded-lg overflow-hidden p-[1px]">
                      <Image
                        src={getOgUrl(user.username!, !!user.golden)}
                        alt={user.username}
                        layout="fill"
                        objectFit="cover"
                        objectPosition="center"
                        placeholder="blur"
                        blurDataURL="/images/blur.png"
                        className="absolute inset-[1px] rounded-md md:rounded-lg"
                      />
                    </div>
                  </div>
                </a>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}
