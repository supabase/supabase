import { useState } from 'react'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'

import { Tabs, Button, Space } from 'ui'
import CodeBlock from '../CodeBlock/CodeBlock'

// Import Swiper styles
import 'swiper/css'
import { Badge } from 'ui'
import Link from 'next/link'

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
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const [swiperDetails, setSwiperDetails] = useState(undefined)

  const [apiSwiperActiveIndex, setApiSwiperActiveIndex] = useState(0)

  function handleApiSwiperNavChange(e: number) {
    setApiSwiperActiveIndex(e)
    // @ts-ignore
    apiSwiper.slideTo(e)
    // @ts-ignore
    swiperDetails.slideTo(e)
  }

  const details = (
    <div>
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
        <Button type="outline">View documentation</Button>
      </p>
    </div>
  )

  return (
    <div className="sbui-tabs--alt col-span-12 space-y-2 lg:col-span-6 lg:col-start-7">
      <Tabs
        scrollable
        // @ts-ignore
        activeId={apiSwiperActiveIndex.toString()}
        // @ts-ignore
        onChange={(id: string) => handleApiSwiperNavChange(Number(id))}
        type="pills"
      >
        {props.content.map((extension, i) => {
          return (
            <Tabs.Panel label={extension.title} id={i.toString()} key={i}>
              <span></span>
            </Tabs.Panel>
          )
        })}
      </Tabs>

      <Swiper
        // @ts-ignore
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
          // @ts-ignore
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
                <Space className="justify-between">
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
                </Space>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

export default SplitCodeBlockCarousel
