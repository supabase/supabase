import { useState } from 'react'
// Import Swiper React components
import { Button, IconArrowUpRight, Tabs, Typography } from '@supabase/ui'
import { Swiper, SwiperSlide } from 'swiper/react'
import CodeBlock from '../CodeBlock/CodeBlock'

interface APIExample {
  lang: 'js' | 'py' | 'sql'
  code: string
  title: string
}

interface Props {
  content?: APIExample
  title: string
  footer?: React.ReactNode
  text?: React.ReactNode
}

function APISection(props: Props) {
  // store API swiper instance
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const [apiSwiperActiveIndex, setApiSwiperActiveIndex] = useState(0)

  function handleApiSwiperNavChange(e: number) {
    setApiSwiperActiveIndex(e)
    // @ts-ignore
    apiSwiper.slideTo(e)
  }

  return (
    <div className="grid grid-cols-12 lg:gap-16">
      <div className="col-span-12 lg:col-span-5 xl:col-span-5 pb-8">
        <Typography.Title level={2}>{props.title}</Typography.Title>
        {props.text}
        <Button size="small" className="mt-4" type="default" icon={<IconArrowUpRight />}>
          Expore documentation
        </Button>
        {props.footer && <div className="py-8">{props.footer}</div>}
      </div>
      <div className="col-span-12 lg:col-span-7 xl:col-span-6 xl:col-start-7 sbui-tabs--alt">
        <Tabs
          scrollable
          // @ts-ignore
          activeId={apiSwiperActiveIndex.toString()}
          // @ts-ignore
          onChange={(id: string) => handleApiSwiperNavChange(Number(id))}
        >
          {props.content &&
            props.content.map((content, i) => (
              <Tabs.Panel label={content.title} id={i.toString()}>
                <span></span>
              </Tabs.Panel>
            ))}
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
            allowTouchMove={false}
          >
            {props.content &&
              props.content.map((content, i) => (
                <SwiperSlide>
                  <CodeBlock key={i} lang={content.lang} size={'large'}>
                    {content.code}
                  </CodeBlock>
                </SwiperSlide>
              ))}
          </Swiper>
        </div>
      </div>
    </div>
  )
}

export default APISection
