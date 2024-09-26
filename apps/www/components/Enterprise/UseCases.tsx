import 'swiper/css'

import React, { FC } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import Link from 'next/link'

import { TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'

import type { LucideIcon } from 'lucide-react'

interface Props {
  id: string
  label: string | JSX.Element
  heading: string | JSX.Element
  stories: Story[]
  highlights: Highlight[]
}

export type Story = {
  url: string
  heading: string
  subheading: string | JSX.Element
}

type Highlight = {
  icon: LucideIcon
  heading: string
  subheading: string
  url: string
}

const UseCases: FC<Props> = (props) => {
  return (
    <SectionContainer id={props.id} className="flex flex-col gap-4 md:gap-8 overflow-visible">
      <div className="flex flex-col gap-2">
        <span className="label">{props.label}</span>
        <h2 className="h2">{props.heading}</h2>
      </div>
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
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-12 mt-8">
        {props.highlights.map((highlight) => (
          <HighlightCard highlight={highlight} key={highlight.heading} />
        ))}
      </ul>
    </SectionContainer>
  )
}

interface StoryCardProps {
  story: Story
}

const StoryCard: FC<StoryCardProps> = ({ story }) => (
  <Link href={story.url} className="w-full h-full">
    <Panel
      outerClassName="w-full h-full"
      hasActiveOnHover
      innerClassName="flex flex-col justify-between text-foreground-lighter p-4 xl:p-6"
    >
      <h3 className="text-foreground">{story.heading}</h3>
      <p className="text-sm">&quot;{story.subheading}&quot;</p>
    </Panel>
  </Link>
)

interface HighlightCardProps {
  highlight: Highlight
}

const HighlightCard: FC<HighlightCardProps> = ({ highlight }) => {
  const Icon: LucideIcon = highlight.icon

  return (
    <li className="text-foreground text-sm">
      <Icon className="stroke-1 mb-2" />
      <h4 className="text-foreground text-xl lg:text-2xl">{highlight.heading}</h4>
      <p className="text-foreground-lighter text-sm">{highlight.subheading}</p>
      <TextLink hasChevron label="Read story" url={highlight.url} className="mt-8" />
    </li>
  )
}

export default UseCases
