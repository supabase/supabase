import { Button, IconCornerRightUp, Tabs } from 'ui'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'

// Import Swiper styles
import 'swiper/css'

import Image from 'next/image'
import TextLink from '../TextLink'
import ImageCarouselStyles from './ImageCarousel.module.css'
import { useInView } from 'framer-motion'

interface Content {
  title: string
  label?: string
  img_url?: string
  text?: string
  cta?: string
  url?: string
  youtube_id?: string
}

interface ImageCarouselProps {
  content: Content[]
  footer?: React.ReactNode
  altTabView?: boolean
}

function ImageCarousel(props: ImageCarouselProps) {
  const sectionRef = useRef<any>(null)
  const isInView = useInView(sectionRef, { margin: '75%', once: true })
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
      <p>
        <span className="mb-8 block text-white">Allow fetch something</span>
      </p>
      <p>
        <p>
          This would only allow the authenticated user access to a folder that is named after their
          own account UID. This is useful for things like profile images.
        </p>
      </p>
      <p>
        <Button type="outline" size="small" icon={<IconCornerRightUp />}>
          View documentation
        </Button>
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-12" ref={sectionRef}>
      <div className="col-span-12 w-full lg:col-span-6">
        <div className="sbui-tabs--alt col-span-12 lg:col-span-7">
          <div className={props.altTabView ? 'hidden' : 'block'}>
            <Tabs
              scrollable
              type={props.altTabView ? 'underlined' : 'pills'}
              // @ts-ignore
              activeId={imageSwiperActiveIndex.toString()}
              // @ts-ignore
              onChange={(id: string) => handleImageSwiperNav(Number(id))}
            >
              {props.content.map((content: Content, i) => {
                return (
                  <Tabs.Panel
                    key={i}
                    label={content.label ? content.label : content.title}
                    id={i.toString()}
                  >
                    <span></span>
                  </Tabs.Panel>
                )
              })}
            </Tabs>
          </div>
          <div
            className={`overflow-hidden rounded-md border border-control bg-border-stronger ${ImageCarouselStyles['gradient-bg']}`}
          >
            <Swiper
              // @ts-ignore
              onSwiper={setImageSwiper}
              style={{ zIndex: 0, overflow: 'auto', overflowX: 'hidden' }}
              initialSlide={0}
              spaceBetween={0}
              slidesPerView={1}
              speed={300}
              allowTouchMove={false}
            >
              {props.content.map((content: Content, i: number) => {
                return (
                  <SwiperSlide key={i}>
                    {content.img_url && (
                      <Image
                        src={`${basePath}${content.img_url}`}
                        alt={content.title}
                        layout="responsive"
                        width="1460"
                        height="960"
                      />
                    )}
                    {isInView && content.youtube_id && (
                      <div className="relative w-full" style={{ padding: '56.25% 0 0 0' }}>
                        <iframe
                          title="Demo video showcasing Supabase"
                          className="absolute h-full w-full rounded-b-md"
                          src={`https://www.youtube-nocookie.com/embed/${content.youtube_id}?playlist=${content.youtube_id}&autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&mute=1&muted=1`}
                          style={{ top: 0, left: 0 }}
                          frameBorder="0"
                          allow="autoplay; modestbranding; encrypted-media"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </div>
        </div>
      </div>
      <div className="col-span-12 mt-8 lg:col-span-5 lg:col-start-8 lg:mt-0 xl:col-span-5 xl:col-start-8">
        <div className={`sbui-tabs--underline-alt ${props.altTabView ? 'block' : 'hidden'} mb-3`}>
          <Tabs
            scrollable
            type="underlined"
            size="small"
            activeId={imageSwiperActiveIndex.toString()}
            onChange={(id: string) => handleImageSwiperNav(Number(id))}
          >
            {props.content.map((content: Content, i: number) => {
              return (
                <Tabs.Panel
                  label={content.label ? content.label : content.title}
                  id={i.toString()}
                  key={i}
                />
              )
            })}
          </Tabs>
        </div>
        <Swiper
          // @ts-ignore
          onSwiper={setSwiperDetails}
          initialSlide={0}
          speed={300}
          allowTouchMove={false}
          autoHeight={true}
        >
          {props.content.map((content, i) => {
            return (
              <SwiperSlide key={i} className="py-4">
                <h4 className="text-foreground mb-4 text-xl">{content.title}</h4>
                <p className="p text-base">{content.text}</p>
                {!!content.url && (
                  <TextLink
                    label={content.cta ? content.cta : 'View documentation'}
                    url={content.url}
                  />
                )}
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
