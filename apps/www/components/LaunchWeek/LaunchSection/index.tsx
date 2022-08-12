import { TruckIcon } from '@heroicons/react/outline'
import { Badge } from '@supabase/ui'

import _days from './../days.json'
import { Article, Product, WeekDayProps } from '../types'
import ArticleButtonListItem from './ArticleButtonListItem'
import ProductButton from './ProductButton'
import ProductButtonListItem from './ProductButtonListItem'

const days = _days as WeekDayProps[]

export const LaunchSection = (props: WeekDayProps) => {
  const lastIndex = props.index === days.length - 1
  const nextDayNotShipped = props.shipped && !days[props.index + 1]?.shipped

  return (
    <div className="grid grid-cols-12">
      {props.shippingHasStarted && (
        <div className="col-span-12 pb-16 lg:col-span-6 lg:pr-8">
          {!props.shipped ? (
            <div className="relative overflow-hidden rounded-xl">
              <img
                className="opacity-30"
                src="/images/launchweek/launchweek-day-placeholder.jpg"
                alt="Supabase"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                className="top-0 left-0 rounded-xl border drop-shadow-lg"
                src="/images/launchweek/security.jpg"
                alt="Supabase"
              />
            </div>
          )}
        </div>
      )}
      <div
        className={[
          `relative col-span-12 flex flex-col
              gap-8
              lg:pl-8
        `,
          props.shipped ? 'border-brand-900' : 'border-purple-700',
          props.shippingHasStarted && 'lg:col-span-6',
          !lastIndex && 'pb-16',
        ].join(' ')}
      >
        {/* START timeline line */}
        {props.index !== days.length - 1 && (
          <div
            className={[
              'launch-week-timeline-border absolute left-0 top-[4px] h-full border-l',
              nextDayNotShipped
                ? 'launch-week-timeline-border--approaching'
                : props.shipped
                ? 'border-brand-900'
                : 'border-purple-700',
            ].join(' ')}
          ></div>
        )}
        {/* END timeline line */}

        <div className="flex flex-col gap-4 pl-4 lg:pl-0">
          {/* START timeline dot */}
          <div
            className={[
              'absolute mt-[4px] -ml-[21px] h-3 w-3 rounded-full border lg:-ml-[37.5px]',
              props.shipped ? 'border-brand-900 bg-brand-400' : 'border-purple-900 bg-purple-300',
            ].join(' ')}
          ></div>
          {/* END timeline dot */}

          <div className="flex items-center gap-3">
            <span className="text-scale-1100 text-sm">{props.date}</span>
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
              <Badge color="purple">Not shipped yet</Badge>
            )}
          </div>
          <h4 className="text-scale-1200 text-2xl md:text-3xl lg:text-4xl">
            {props.shipped ? props.title : props.dd + ' 08:00 PT | 11:00 ET'}
          </h4>

          {/* {props.shipped && props.announcements && (
              <div>
                {props.announcements.map((announcement: Announcement) => (
                  <Announcement {...announcement} />
                ))}
              </div>
            )} */}
          {props.shipped && <p className="text-scale-1100 text-base">{props.description}</p>}
        </div>
        {props.shipped && (
          <div className="flex flex-col gap-12">
            {props.articles &&
              props.articles.map((article: Article) => (
                <div
                  className="
                dark:bg-scale-300 rounded border bg-white
                "
                >
                  <div className="p-6 px-10">
                    <ArticleButtonListItem {...article} />
                  </div>

                  {/* border */}
                  <div className="bg-scale-300 dark:bg-scale-400 h-px w-full"></div>

                  <div className="flex flex-col gap-6 p-6 px-10 pb-10">
                    <h3 className="text-scale-1100 mb-2">New releases</h3>
                    {article.products &&
                      article.products.map((product: Product) => (
                        <ProductButtonListItem {...product} />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
        <div className="">
          {props.products &&
            props.products.map((product: Product) => <ProductButton {...product} />)}
        </div>
      </div>
    </div>
  )
}

export default LaunchSection
