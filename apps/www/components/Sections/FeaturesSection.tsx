import Link from 'next/link'
import React, { useRef, ReactNode } from 'react'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Button, IconArrowUpRight } from 'ui'

interface Feature {
  icon: string
  title: string
  text: string
}
interface Props {
  title: string | ReactNode
  paragraph: string
  cta?: {
    label?: string
    link: string
  }
  features: Feature[]
}

const FeaturesSection = ({ title, paragraph, cta, features }: Props) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-5%', once: true })

  return (
    <LazyMotion features={domAnimation}>
      <SectionContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 justify-between">
          <div className="col-span-full lg:col-span-4 gap-2 flex flex-col">
            <h2 className="text-2xl sm:text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
              {title}
            </h2>
            <p className="text-scale-900 mb-4">{paragraph}</p>
            {cta && (
              <Link href={cta.link}>
                <a>
                  <Button type="default" size="small" icon={<IconArrowUpRight />}>
                    {cta.label ?? 'Explore documentation'}
                  </Button>
                </a>
              </Link>
            )}
          </div>
          <div
            ref={ref}
            className="col-span-full lg:col-start-6 lg:col-span-7 space-y-10 lg:space-y-0 flex flex-col lg:grid lg:grid-cols-2 lg:gap-16"
          >
            {features.map((feature: Feature, i: number) => (
              <Feature feature={feature} index={i} isInView={isInView} key={feature.title} />
            ))}
          </div>
        </div>
      </SectionContainer>
    </LazyMotion>
  )
}

const Feature = ({
  feature,
  index,
  isInView,
}: {
  feature: Feature
  index: number
  isInView: boolean
}) => {
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ delay: index * 0.1 })

  return (
    <m.div
      className="h-full flex items-start space-x-3 w-full"
      initial={initial}
      animate={isInView ? animate : initial}
    >
      <div className="flex items-center">
        <div className="relative w-full h-6 flex items-center mx-auto">
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={feature.icon}
              stroke="var(--colors-scale12)"
              strokeMiterlimit="10"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
      <div className="text-sm lg:text-base">
        <h2 className="text-base">{feature.title}</h2>
        <ReactMarkdown className="prose pt-1 text-sm text-scale-900">{feature.text}</ReactMarkdown>
      </div>
    </m.div>
  )
}

export default FeaturesSection
