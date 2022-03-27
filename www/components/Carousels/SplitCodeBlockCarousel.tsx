import { useState } from 'react'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'

import { Tabs, Button, Space } from '@supabase/ui'
import CodeBlock from '../CodeBlock/CodeBlock'

// Import Swiper styles
import 'swiper/swiper.min.css'
import { Badge } from '@supabase/ui'
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
    <div className="">
      <p>
        <span className="block text-white mb-8">Allow fetch something</span>
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
    <div className="col-span-12 lg:col-span-6 lg:col-start-7 sbui-tabs--alt">
      <Tabs
        scrollable
        // @ts-ignore
        activeId={apiSwiperActiveIndex.toString()}
        // @ts-ignore
        onChange={(id: string) => handleApiSwiperNavChange(Number(id))}
      >
        {props.content.map((extension, i) => {
          return (
            <Tabs.Panel label={extension.title} id={i.toString()} key={i}>
              <span></span>
            </Tabs.Panel>
          )
        })}
      </Tabs>
      <div className="border border-gray-100 dark:border-gray-600 rounded-md bg-scale-300 overflow-hidden">
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

        <div className="overflow-hidden p-8 bg-scale-300 rounded-md border border-t-none border-t-0 border-gray-600">
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
                  <div className="">
                    <p>
                      <span className="block text-lg text-scale-1200 dark:text-white mb-4">
                        {extension.detail_title}
                      </span>
                    </p>
                    <p className="block mb-6">
                      <p>{extension.detail_text}</p>
                    </p>
                    <Space className="justify-between">
                      {extension.url && (
                        <Link href={extension.url} as={extension.url}>
                          <a className="ml-px">
                            <Button as="a" type="default">
                              View documentation
                            </Button>
                          </a>
                        </Link>
                      )}
                      <div>
                        <p className="mr-4">{extension.badges_label}</p>
                        {extension.badges &&
                          extension.badges.map((badge, i) => {
                            return <Badge key={badge}>{badge}</Badge>
                          })}
                      </div>
                    </Space>
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>
    </div>
  )
}

export default SplitCodeBlockCarousel
