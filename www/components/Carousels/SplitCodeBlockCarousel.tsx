import { useState } from 'react'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'

import { Tabs, Typography, Button, Space } from '@supabase/ui'
import CodeBlock from '../CodeBlock/CodeBlock'

// Import Swiper styles
import 'swiper/swiper.min.css'
import Badge from '../Badge'

interface SplitCodeBlockCarousel {
  content: any
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
    <div className="col-span-12 lg:col-span-6 lg:col-start-7">
      <Tabs
        scrollable
        // @ts-ignore
        activeId={apiSwiperActiveIndex.toString()}
        // @ts-ignore
        onChange={(id: string) => handleApiSwiperNavChange(Number(id))}
      >
        {props.content.map((extension, i) => {
          return (
            <Tabs.Panel label={extension.title} id={i.toString()}>
              <span></span>
            </Tabs.Panel>
          )
        })}
      </Tabs>
      <div className="border border-gray-100 dark:border-gray-600 rounded-md bg-gray-800 overflow-hidden">
        <Swiper
          // @ts-ignore
          onSwiper={setApiSwiper}
          style={{ zIndex: 0 }}
          initialSlide={apiSwiperActiveIndex}
          spaceBetween={0}
          slidesPerView={1}
          speed={400}
          autoHeight={true}
          allowTouchMove={false}
        >
          {props.content.map((extension, i) => {
            return (
              <SwiperSlide>
                <CodeBlock key={i} lang={extension.lang}>
                  {extension.code}
                </CodeBlock>
              </SwiperSlide>
            )
          })}
        </Swiper>

        <div className="overflow-hidden bg-gray-800 p-8 dark rounded-md border border-t-none border-t-0 border-gray-600">
          <Swiper
            // @ts-ignore
            onSwiper={setSwiperDetails}
            style={{ zIndex: 0 }}
            initialSlide={2}
            spaceBetween={0}
            slidesPerView={1}
            direction="horizontal"
            // style={{ overflow: 'hidden' }}
            speed={400}
            allowTouchMove={false}
          >
            {props.content.map((extension, i) => {
              return (
                <SwiperSlide key={i}>
                  <div className="">
                    <Typography.Text>
                      <span className="block text-lg text-white mb-4">
                        {extension.detail_title}
                      </span>
                    </Typography.Text>
                    <Typography.Text type="secondary" className="block mb-6">
                      <p>{extension.detail_text}</p>
                    </Typography.Text>
                    <Space className="justify-between">
                      <Typography.Text>
                        <Button type="outline">View documentation</Button>
                      </Typography.Text>
                      <div>
                        <Typography.Text type="secondary" className="mr-4">
                          {extension.badges_label}
                        </Typography.Text>
                        {extension.badges &&
                          extension.badges.map((badge, i) => {
                            return <Badge>{badge}</Badge>
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
