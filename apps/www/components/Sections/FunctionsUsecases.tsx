import { useState } from 'react'
// Import Swiper React components
import { Button, IconArrowUpRight } from 'ui'
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

function FunctionsUsecases(props: Props) {
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
      <div className="col-span-12 pb-8 lg:col-span-5 xl:col-span-5">
        <h2 className="h3">{props.title}</h2>
        <div className="p">{props.text}</div>

        <div className="flex flex-col gap-3">
          {props.content.map((feat, i) => {
            const active = i == apiSwiperActiveIndex
            return (
              <button
                key={`featureHighlighted-${i}`}
                className={
                  'bg-background hover:bg-surface-100 hover:border group rounded-md border px-6 py-4 text-left transition-all' +
                  (active ? ' bg-surface-200 border-foreground-lighter' : '')
                }
                // onClick={() => setCurrentSelection(feat.highlightLines)}
                onClick={() => handleApiSwiperNavChange(i)}
              >
                <div
                  className={
                    'transition-colors ' +
                    (active
                      ? ' text-foreground'
                      : ' text-foreground-light group-hover:text-foreground')
                  }
                >
                  {feat.title}
                </div>
                <div
                  className={
                    'text-sm transition-colors ' +
                    (active
                      ? ' text-foreground-light'
                      : ' text-foreground-light group-hover:text-foreground-light ')
                  }
                >
                  {/*
                  // @ts-ignore */}
                  {feat.description}
                </div>
              </button>
            )
          })}
          {props.documentation_link && (
            <Button
              asChild
              size="small"
              className="mt-4"
              type="default"
              icon={<IconArrowUpRight />}
            >
              <Link href={props.documentation_link} as={props.documentation_link}>
                Explore documentation
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="sbui-tabs--alt col-span-12 lg:col-span-7 xl:col-span-6 xl:col-start-7">
        <div className="overflow-hidden">
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

export default FunctionsUsecases
