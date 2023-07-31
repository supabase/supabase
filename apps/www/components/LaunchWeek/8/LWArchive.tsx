import React from 'react'
import { StyledArticleBadge } from './Releases/components'
import Image from 'next/image'
import Link from 'next/link'

import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/swiper.min.css'

const launchweeks = [
  { title: '7', link: '/launchweek/7' },
  { title: '6', link: '/launchweek/6' },
  { title: '5', link: '/blog/launch-week-5-hackathon' },
  { title: '4', link: '/blog/supabase-launch-week-four' },
  { title: '3', link: '/blog/supabase-launch-week-the-trilogy' },
  { title: '2', link: '/blog/supabase-launch-week-sql' },
  { title: '1', link: '/blog/launch-week' },
]

const LWArchive = () => {
  return (
    <div className="text-center relative z-10 text-white flex flex-col gap-8 lg:gap-16">
      <div className="max-w-[38rem] mx-auto flex flex-col items-center gap-4 px-4">
        <StyledArticleBadge>Throwback</StyledArticleBadge>
        <h2 className="text-4xl">Previous Launch Weeks</h2>
        <p className="text-[#9296AA]">
          Explore what has been announced in the past and relive those moments.
        </p>
      </div>
      <div className="relative h-[200px] [&_.swiper-container]:h-full [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full">
        <Swiper
          // centeredSlides={true}
          spaceBetween={10}
          slidesPerView={5.5}
          // watchOverflow
          threshold={2}
          updateOnWindowResize
          breakpoints={{
            320: {
              slidesPerView: 2.5,
            },
            720: {
              slidesPerView: 3.5,
            },
            1440: {
              slidesPerView: 5.5,
            },
          }}
        >
          {launchweeks.map((launchweek, i) => (
            <SwiperSlide key={launchweek.title}>
              <Link href={launchweek.link} key={launchweek.title}>
                <a className="relative h-full rounded-md md:rounded-lg transition-transform bg-[#030A0C] flex items-center justify-center border border-[#111718] hover:border-brand-800">
                  <span className="stroke-text inline-block text-transparent bg-clip-text bg-gradient-to-b from-scale-1000 to-scale-200 text-7xl">
                    {launchweek.title}
                  </span>
                </a>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default LWArchive
