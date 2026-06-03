import { useState } from 'react'
// Import Swiper React components
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react'
import { Button, cn, Tabs } from 'ui'

import CodeBlock from '../CodeBlock/CodeBlock'
// Import Swiper styles
import 'swiper/css'

import Link from 'next/link'
import { Badge } from 'ui'

interface Content {
  lang: 'js' | 'py' | 'sql'
  title: string
  code: string
  detail_title?: string
  detail_text?: string
  badges_label?: string
  badges?: string[]
  url?: string
}

interface SplitCodeBlockCarousel {
  content: Content[]
  footer?: React.ReactNode
  altTabView?: boolean
}

function SplitCodeBlockCarousel(props: SplitCodeBlockCarousel) {
  // store API swiper instance
  const [apiSwiper, setApiSwiper] = useState<SwiperClass | undefined>(undefined)
  const [swiperDetails, setSwiperDetails] = useState<SwiperClass | undefined>(undefined)

  const [apiSwiperActiveIndex, setApiSwiperActiveIndex] = useState(0)

  function handleApiSwiperNavChange(e: number) {
    setApiSwiperActiveIndex(e)
    if (!apiSwiper || !swiperDetails) return
    apiSwiper.slideTo(e)
    swiperDetails.slideTo(e)
  }

  return (
    <div className="sbui-tabs--alt col-span-12 space-y-2 lg:col-span-6 lg:col-start-7">
      <div className="flex gap-2 mb-2 flex-nowrap overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {props.content.map((extension, i) => {
          return (
            <Button
              type="default"
              className={cn('shrink-0', { 'opacity-50': i !== apiSwiperActiveIndex })}
              onClick={() => handleApiSwiperNavChange(i)}
              key={i}
              disabled={!apiSwiper || !swiperDetails}
            >
              {extension.title}
            </Button>
          )
        })}
      </div>

      <Swiper
        onSwiper={setApiSwiper}
        style={{ zIndex: 0 }}
        initialSlide={apiSwiperActiveIndex}
        spaceBetween={0}
        slidesPerView={1}
        speed={300}
        autoHeight={true}
        allowTouchMove={false}
      >
        {props.content.map((extension, i) => {
          return (
            <SwiperSlide key={i}>
              <CodeBlock key={i} lang={extension.lang}>
                {extension.code}
              </CodeBlock>
            </SwiperSlide>
          )
        })}
      </Swiper>

      <div className="bg-surface-100 border-default overflow-hidden rounded-md border p-8">
        <Swiper
          onSwiper={setSwiperDetails}
          style={{ zIndex: 0 }}
          initialSlide={0}
          spaceBetween={0}
          slidesPerView={1}
          direction="horizontal"
          // style={{ overflow: 'hidden' }}
          speed={300}
          allowTouchMove={false}
        >
          {props.content.map((extension, i) => {
            return (
              <SwiperSlide key={i}>
                <p>
                  <span className="text-foreground mb-4 block text-lg">
                    {extension.detail_title}
                  </span>
                </p>
                <p className="p mb-6 block">{extension.detail_text}</p>
                <div>
                  {extension.url && (
                    <Button asChild type="default">
                      <Link href={extension.url} as={extension.url} className="ml-px">
                        View documentation
                      </Link>
                    </Button>
                  )}
                  <div>
                    <p className="p mr-4">{extension.badges_label}</p>
                    {extension.badges &&
                      extension.badges.map((badge, i) => {
                        return <Badge key={badge}>{badge}</Badge>
                      })}
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

export default SplitCodeBlockCarousel
