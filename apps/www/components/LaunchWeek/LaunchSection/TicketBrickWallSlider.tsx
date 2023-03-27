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
  xOffset?: number
  speed?: number
}

export function TicketBrickWallSlider({ users, reverse, xOffset = 250, speed = 10000 }: Props) {
  const ref = useRef(null)
  const [swiperInstace, setSwiperInstance] = useState<SwiperCore | any | null>(null)
  const { width } = useWindowSize()
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7'
  const getOgUrl = (username: string) => `${STORAGE_URL}/tickets/gallery/${username}.png`

  useEffect(() => {
    if (swiperInstace) swiperInstace?.autoplay?.run()
  }, [width])

  return (
    <div ref={ref} className="relative h-auto w-full m-0 overflow-hidden mb-2.5">
      <div className="flex ticket-brick-swiper">
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
                <a className="relative !w-[230px] md:w-[450px] !h-[200px] transform scale-100 md:hover:scale-[101%] transition-transform">
                  <div className="relative inset-0 w-full pt-[50%] transform rounded-md md:rounded-lg overflow-hidden">
                    <Image
                      src={getOgUrl(user.username!)}
                      alt={user.username}
                      layout="fill"
                      objectFit="cover"
                      quality={50}
                      objectPosition="center"
                      placeholder="blur"
                      blurDataURL="/images/blur.png"
                    />
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
