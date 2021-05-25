import { useState } from 'react'
// Import Swiper React components
import { Button, IconArrowUpRight, Tabs, Typography } from '@supabase/ui'
import { Swiper, SwiperSlide } from 'swiper/react'
import CodeBlock from '../CodeBlock/CodeBlock'
import Link from 'next/link'

interface Example {
  lang: 'js' | 'py' | 'sql'
  title: string
  code: string
}

interface Props {
  size?: 'small' | 'large'
  content: Example[]
  title: string | React.ReactNode
  footer?: React.ReactNode
  text?: React.ReactNode
  autoHeight?: boolean
  documentation_link?: string
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
        <Typography.Text>{props.text}</Typography.Text>
        {props.documentation_link && (
          <Link href={props.documentation_link} as={props.documentation_link}>
            <a>
              <Button size="small" className="mt-4" type="default" icon={<IconArrowUpRight />}>
                Explore documentation
              </Button>
            </a>
          </Link>
        )}
        {props.footer && <div className="py-8">{props.footer}</div>}
      </div>
      <div className="col-span-12 lg:col-span-7 xl:col-span-6 xl:col-start-7 sbui-tabs--alt">
        <Tabs
          scrollable
          activeId={apiSwiperActiveIndex.toString()}
          onChange={(id: string) => handleApiSwiperNavChange(Number(id))}
        >
          {props.content &&
            props.content.map((content: Example, i) => (
              <Tabs.Panel label={content.title} id={i.toString()} key={i}>
                <span key={i}></span>
              </Tabs.Panel>
            ))}
        </Tabs>
        <div className="bg-gray-800 overflow-hidden">
          <Swiper
            // @ts-ignore
            onSwiper={setApiSwiper}
            style={{ zIndex: 0, marginRight: '1px' }}
            initialSlide={apiSwiperActiveIndex}
            spaceBetween={0}
            slidesPerView={1}
            speed={300}
            allowTouchMove={false}
            autoHeight={props.autoHeight ? props.autoHeight : false}
          >
            {props.content &&
              props.content.map((content: Example, i) => (
                <SwiperSlide key={i}>
                  <CodeBlock key={i} lang={content.lang} size={props.size ? props.size : 'small'}>
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
