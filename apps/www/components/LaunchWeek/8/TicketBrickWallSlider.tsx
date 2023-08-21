import Image from 'next/image'
import Link from 'next/link'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'

import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/swiper.min.css'

interface Props {
  users: UserData[]
  reverse?: boolean
  speed?: number
  animate?: boolean
}

export function TicketBrickWallSlider({ users, reverse, speed = 50000, animate }: Props) {
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw8'
  const BUCKET_FOLDER_VERSION = 'v1'
  const getOgUrl = (username: string, isGold: boolean) =>
    `${STORAGE_URL}/tickets/${
      isGold ? 'golden' : 'regular'
    }/${BUCKET_FOLDER_VERSION}/${username}.png`

  return (
    <div className="relative h-auto w-full m-0 overflow-hidden mb-2.5">
      <div
        className={[
          'flex swiper-transition-linear ticket-brick-swiper',
          reverse && '-translate-x-20 w-[calc(100vw+400px)]',
        ].join(' ')}
      >
        <Swiper
          centeredSlides={true}
          spaceBetween={10}
          slidesPerView={5}
          loop={true}
          watchOverflow
          threshold={2}
          updateOnWindowResize
          breakpoints={{
            320: {
              slidesPerView: reverse ? 4.5 : 2.5,
            },
            720: {
              slidesPerView: reverse ? 5.5 : 3.5,
            },
            1440: {
              slidesPerView: reverse ? 6.5 : 5,
            },
          }}
        >
          {users.map((user, i) => (
            <SwiperSlide key={user.username}>
              <Link href={`/launch-week/tickets/${user.username}`} key={user.username}>
                <a className="relative !w-[230px] md:w-[450px] !h-[200px] rounded-md md:rounded-lg transition-transform">
                  <div className="relative w-full pt-[50%] transform rounded-md md:rounded-lg overflow-hidden bg-gradient-to-b from-[#22282a] to-[#030A0C]">
                    <div className="absolute inset-[1px] w-[calc(100%-2px)] h-[calc(100%-2px)] rounded-md md:rounded-lg overflow-hidden p-[1px]">
                      <Image
                        src={
                          getOgUrl(user.username!, !!user.golden) ??
                          '/images/launchweek/8/lw8-ticket-empty.jpg'
                        }
                        alt={user.username}
                        layout="fill"
                        objectFit="cover"
                        objectPosition="center"
                        placeholder="blur"
                        blurDataURL="/images/launchweek/8/lw8-ticket-empty.jpg"
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
