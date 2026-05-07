import Image from 'next/image'
import { useState } from 'react'
import { PlayIcon, TruckIcon, XIcon } from '@heroicons/react/outline'
import { Badge, Modal } from 'ui'

import { Article, Product, WeekDayProps } from '../../types'
import _days from './../days.json'
import ArticleButtonListItem from './ArticleButtonListItem'
import ProductButtonListItem from './ProductButtonListItem'

const days = _days as WeekDayProps[]

export const LaunchSection = (props: WeekDayProps) => {
  const lastIndex = props.index === days.length - 1
  const nextDayNotShipped = props.shipped && !days[props.index + 1]?.shipped
  const [videoVisible, setVideoVisible] = useState(false)

  interface ClassNameComponent {
    className?: string
  }

  const Header = ({ className }: ClassNameComponent) => (
    <div className={['flex flex-col gap-3', className].join(' ')}>
      {/* START timeline dot */}
      <div
        className={[
          'absolute mt-[4px] -ml-[21px] h-3 w-3 rounded-full border md:-ml-[37px] lg:-ml-[37.5px]',
          props.shipped ? 'border-brand bg-brand-400' : 'border-purple-900 bg-purple-300',
        ].join(' ')}
      ></div>
      {/* END timeline dot */}
      <div className="flex items-center gap-3">
        <span className="text-foreground-light text-sm">{props.date}</span>
        {props.shipped ? (
          <Badge>
            <div className="flex items-center gap-2">
              <div className="w-4">
                <TruckIcon />
              </div>{' '}
              Shipped
            </div>
          </Badge>
        ) : (
          <Badge variant="secondary">Not shipped yet</Badge>
        )}
      </div>
      <h4 className="text-foreground text-2xl md:text-3xl lg:text-4xl">
        {props.shipped ? props.title : props.dd + ' 08:00 PT | 11:00 ET'}
      </h4>

      {props.shipped && <p className="text-foreground-light text-base">{props.description}</p>}
    </div>
  )

  const TimelineLine = ({ className }: ClassNameComponent) => {
    return (
      <>
        {/* START timeline line */}
        {props.index !== days.length - 1 && (
          <div
            className={[
              'launch-week-timeline-border absolute left-0 top-[4px] h-full border-l',
              nextDayNotShipped
                ? 'launch-week-timeline-border--approaching'
                : props.shipped
                  ? 'border-brand'
                  : 'border-purple-700',
              className,
            ].join(' ')}
          ></div>
        )}
        {/* END timeline line */}
      </>
    )
  }

  return (
    <div className="relative grid grid-cols-12" id={`launch-week-5-day-${props.d}`}>
      <TimelineLine className="block lg:hidden" />
      {props.shippingHasStarted ? (
        <div className="col-span-12 pb-8 pl-4 md:pl-8 lg:col-span-6 lg:pb-16 lg:pl-0 lg:pr-8">
          <Header className="mb-8 flex lg:hidden" />
          {!props.shipped ? (
            <div className="relative overflow-hidden rounded-xl">
              <img
                className="opacity-30"
                src="/images/launchweek/launchweek-day-placeholder.jpg"
                alt="Supabase"
              />
            </div>
          ) : (
            <>
              <div className="group relative cursor-pointer">
                <Image
                  alt="Supabase"
                  width={528}
                  height={352}
                  className="rounded-xl border drop-shadow-lg"
                  src={`/images/launchweek/day${props.d}/thumb.jpg`}
                />
                <div
                  onClick={() => setVideoVisible(true)}
                  className="absolute top-0 left-0 flex h-full w-full items-center justify-center"
                >
                  <PlayIcon
                    strokeWidth={1.5}
                    className="text-foreground absolute w-24 opacity-50 transition-all group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
              </div>

              <Modal
                size="xxlarge"
                visible={videoVisible}
                onCancel={() => setVideoVisible(false)}
                hideFooter
                header={
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">{props.title}</span>
                    <XIcon
                      className="text-muted hover:text-foreground w-4 cursor-pointer transition"
                      onClick={() => setVideoVisible(false)}
                    />
                  </div>
                }
              >
                <div>
                  <div className="video-container">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${props.youtube_id}?autoplay=1`}
                      title="YouTube video player"
                      frameBorder={0}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </Modal>
            </>
          )}
        </div>
      ) : (
        <div className="col-span-12 pl-4 md:pl-8 lg:col-span-6 lg:pl-0 lg:pr-8">
          <Header className="mb-8 flex lg:hidden" />
        </div>
      )}
      <div
        className={[
          `relative col-span-12 flex flex-col
              gap-8
              pl-4
              md:pl-8
              lg:pl-8
        `,
          props.shipped ? 'border-brand' : 'border-purple-700',
          props.shippingHasStarted && 'lg:col-span-6',
          !lastIndex && 'pb-8 lg:pb-16',
        ].join(' ')}
      >
        <TimelineLine className="hidden lg:block" />
        <Header className="hidden lg:flex" />
        {props.shipped && (
          <div className="flex flex-col gap-12">
            {props.articles &&
              props.articles.map((article: Article, index) => (
                <div key={article.url + index} className="bg-surface-100 rounded border">
                  <div className="p-6 px-10">
                    <ArticleButtonListItem {...article} />
                  </div>

                  {article.products && (
                    <>
                      {/* border */}
                      <div className="bg-surface-200 h-px w-full"></div>

                      <div className="flex flex-col gap-6 p-6 px-10 pb-10">
                        <h3 className="text-foreground-light text-sm">New releases</h3>
                        {article.products &&
                          article.products.map((product: Product, index) => (
                            <ProductButtonListItem key={product.url + index} {...product} />
                          ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LaunchSection
