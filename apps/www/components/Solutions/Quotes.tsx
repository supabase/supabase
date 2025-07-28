import 'swiper/css'

import Link from 'next/link'
import { FC } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'

import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'

import type { Quote, Quotes } from '~/data/solutions/solutions.utils'
import Image from 'next/image'

const Quotes: FC<Quotes> = (props) => (
  <section id={props.id}>
    <div className="overflow-hidden">
      <SectionContainer className="!py-4">
        <ul className="hidden xl:flex flex-col gap-4 md:flex-row items-stretch w-full h-auto min-h-64">
          {props.items?.map((quote: Quote) => (
            <li key={quote.author} className="w-full">
              <QuoteCard {...quote} />
            </li>
          ))}
        </ul>
        <div className="xl:hidden">
          <Swiper
            style={{ zIndex: 0, marginRight: '1px' }}
            initialSlide={0}
            spaceBetween={12}
            slidesPerView={1.2}
            speed={300}
            watchOverflow
            threshold={2}
            updateOnWindowResize
            className="h-[300px] w-full !overflow-visible"
            breakpoints={{
              320: {
                slidesPerView: 1.2,
              },
              540: {
                slidesPerView: 1.5,
              },
              900: {
                slidesPerView: 2.5,
              },
            }}
          >
            {props.items?.map((quote: Quote, i: number) => (
              <SwiperSlide key={`${i}-mobile`}>
                <QuoteCard {...quote} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </SectionContainer>
    </div>
  </section>
)

const QuoteCard: FC<Quote> = ({ quote, author, avatar, authorTitle }) => {
  return (
    <Panel
      outerClassName="w-full h-full"
      innerClassName="flex flex-col justify-between text-foreground-lighter bg-surface-75 p-5"
    >
      <div className="flex flex-col justify-between gap-6">
        <q className="text-base">{quote}</q>
      </div>

      <div className="flex flex-row gap-3 w-full items-center">
        <Image
          src={avatar}
          alt={author}
          width={32}
          height={32}
          className="bg-surface-200 rounded-full border flex-shrink-0"
        />
        <div className="flex flex-col gap-0">
          <span className="text-base text-foreground-light leading-snug">{author}</span>
          {authorTitle && (
            <span className="uppercase font-mono text-sm text-foreground-lighter leading-tight">
              {authorTitle}
            </span>
          )}
        </div>
      </div>
    </Panel>
  )
}

export default Quotes
