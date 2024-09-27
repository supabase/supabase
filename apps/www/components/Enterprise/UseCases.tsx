import 'swiper/css'

import React, { FC } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import Link from 'next/link'

import { TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'

import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'

interface Props {
  id: string
  label: string | JSX.Element
  heading: string | JSX.Element
  stories: Story[]
  highlights: Highlight[]
}

export type Story = {
  icon: string
  url: string
  target?: '_blank' | string
  heading: string
  subheading: string | JSX.Element
}

type Highlight = {
  icon: LucideIcon
  heading: string
  subheading: string
  url: string
}

const UseCases: FC<Props> = (props) => (
  <section id={props.id}>
    <SectionContainer className="flex flex-col gap-4 md:gap-8 !pb-0">
      <div className="flex flex-col gap-2">
        <span className="label">{props.label}</span>
        <h2 className="h2">{props.heading}</h2>
      </div>
    </SectionContainer>
    <div className="overflow-hidden">
      <SectionContainer className="!py-4">
        <ul className="hidden xl:flex flex-col gap-4 md:flex-row items-stretch w-full h-auto min-h-[300px]">
          {props.stories.map((story) => (
            <li key={story.heading} className="w-full">
              <StoryCard story={story} />
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
            {props.stories.map((story: Story, i: number) => (
              <SwiperSlide key={`${story.heading}-mobile`}>
                <StoryCard story={story} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </SectionContainer>
    </div>
    <SectionContainer className="!pt-0">
      <ul className="grid grid-cols-2 gap-4 sm:gap-10 gap-y-10 lg:grid-cols-4 md:gap-12 lg:gap-x-8 mt-8">
        {props.highlights.map((highlight) => (
          <HighlightCard highlight={highlight} key={highlight.heading} />
        ))}
      </ul>
    </SectionContainer>
  </section>
)

interface StoryCardProps {
  story: Story
}

const StoryCard: FC<StoryCardProps> = ({ story }) => (
  <Link href={story.url} target={story.target ?? undefined} className="w-full h-full">
    <Panel
      outerClassName="w-full h-full"
      hasActiveOnHover
      innerClassName="flex flex-col justify-between text-foreground-lighter bg-surface-75 p-2"
    >
      <div className="flex flex-col justify-between gap-6 p-3 md:max-w-[230px]">
        <Image
          src={story.icon}
          alt={story.heading}
          width={150}
          height={30}
          className="max-h-[23px] max-w-[150px] w-auto object-contain object-left-bottom filter invert dark:invert-0 opacity-60"
        />
        <h3 className="text-foreground">{story.heading}</h3>
      </div>
      <div className="p-3 bg-surface-200 rounded-lg">
        <q className="text-sm block">{story.subheading}</q>
      </div>
    </Panel>
  </Link>
)

interface HighlightCardProps {
  highlight: Highlight
}

const HighlightCard: FC<HighlightCardProps> = ({ highlight }) => {
  const Icon: LucideIcon = highlight.icon

  return (
    <li className="text-foreground text-sm max-w-[250px]">
      <Icon className="stroke-1 mb-2" />
      <h4 className="text-foreground text-xl lg:text-2xl">{highlight.heading}</h4>
      <p className="text-foreground-lighter text-sm">{highlight.subheading}</p>
      <TextLink hasChevron label="Read story" url={highlight.url} className="mt-4" />
    </li>
  )
}

export default UseCases
