import { useRouter } from 'next/router'
import { Tabs, Typography, Button } from '@supabase/ui'
import { useState } from 'react'

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { EffectFade } from 'swiper'

// Import Swiper styles
import 'swiper/swiper.min.css'
import 'swiper/components/effect-fade/effect-fade.min.css'

import CodeBlock from '../CodeBlock/CodeBlock'

import ImageCarouselStyles from './ImageCarousel.module.css'
import TweetCard from '../TweetCard'

SwiperCore.use([EffectFade])

interface Content {
  title: string
  label?: string
  img_url: string
  text: string
}

interface ImageCaoursel {
  content: Content
  footer?: React.ReactNode
}

function ImageCarousel(props: ImageCaoursel) {
  // base path for images
  const { basePath } = useRouter()

  // store API swiper instance
  const [imageSwiper, setImageSwiper] = useState(undefined)
  const [swiperDetails, setSwiperDetails] = useState(undefined)

  const [imageSwiperActiveIndex, setImageSwiperActiveIndex] = useState(0)

  function handleImageSwiperNav(e: number) {
    setImageSwiperActiveIndex(e)
    // @ts-ignore
    imageSwiper.slideTo(e)
    // @ts-ignore
    swiperDetails.slideTo(e)
  }

  const details = (
    <div className="h-64 bg-white">
      <Typography.Text>
        <span className="block text-white mb-8">Allow fetch something</span>
      </Typography.Text>
      <Typography.Text type="secondary">
        <p>
          This would only allow the authenticated user access to a folder that is named after their
          own account UID. This is useful for things like profile images.
        </p>
      </Typography.Text>
      <Typography.Text>
        <Button type="outline">View documentation</Button>
      </Typography.Text>
    </div>
  )

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-6 w-full">
        <div className="col-span-12 lg:col-span-7">
          <Tabs
            scrollable
            // @ts-ignore
            activeId={imageSwiperActiveIndex.toString()}
            // @ts-ignore
            onChange={(id: string) => handleImageSwiperNav(Number(id))}
          >
            {props.content.map((content, i) => {
              return (
                <Tabs.Panel label={content.label ? content.label : content.title} id={i.toString()}>
                  <span></span>
                </Tabs.Panel>
              )
            })}
          </Tabs>
          <div
            className={`border border-gray-100 dark:border-gray-600 rounded-md bg-gray-800 overflow-hidden ${ImageCarouselStyles['gradient-bg']}`}
          >
            <Swiper
              // @ts-ignore
              onSwiper={setImageSwiper}
              style={{ zIndex: 0 }}
              initialSlide={0}
              spaceBetween={0}
              slidesPerView={1}
              speed={400}
              autoHeight={true}
              allowTouchMove={false}
            >
              {props.content.map((content, i) => {
                return (
                  <SwiperSlide key={i}>
                    <img src={`${basePath}${content.img_url}`} />
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </div>
        </div>
      </div>
      <div className="col-span-4 col-start-9">
        <Swiper
          // @ts-ignore
          onSwiper={setSwiperDetails}
          // style={{ zIndex: 0 }}
          initialSlide={0}
          // spaceBetween={0}
          // slidesPerView={1}
          // direction="horizontal"
          // style={{ overflow: 'hidden' }}
          speed={400}
          allowTouchMove={false}
          autoHeight={true}
        >
          {props.content.map((content, i) => {
            return (
              <SwiperSlide key={i}>
                <div className="bg-white dark:bg-gray-800">
                  <Typography.Title level={4}>{content.title}</Typography.Title>
                  <Typography.Text>
                    <p className="text-base">{content.text}</p>
                    <Button className="mb-8">See documentation</Button>
                  </Typography.Text>
                </div>
              </SwiperSlide>
            )
          })}
          {props.footer && <div className="my-8">{props.footer}</div>}
        </Swiper>
      </div>
    </div>
  )
}

export default ImageCarousel
