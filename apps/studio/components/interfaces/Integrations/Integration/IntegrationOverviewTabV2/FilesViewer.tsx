'use client'

import 'swiper/css'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Image } from 'ui-patterns/Image'

export const FilesViewer = ({ files }: { files: { src: string; alt: string }[] }) => {
  return (
    <Swiper
      className="w-full"
      spaceBetween={12}
      slidesPerView={1.4}
      threshold={2}
      watchOverflow
      breakpoints={{
        640: { slidesPerView: 1.4 },
        1024: { slidesPerView: 3.2 },
      }}
    >
      {files.map((file, i) => (
        <SwiperSlide key={`${file.src}-${i}`}>
          <Image
            src={file.src}
            alt={file.alt}
            zoomable
            width={400}
            height={225}
            className="rounded-md border object-cover w-full"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
