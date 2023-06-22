import Link from 'next/link'
import React, { ReactNode, useRef } from 'react'
import { Button, IconArrowUpRight } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import InteractiveShimmerCard from '../Panel'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'

interface Example {
  img?: string
  title: string
  description: string
  icon?: string
  cta?: {
    label?: string
    link: string
    isDisabled?: boolean
  }
}

interface Props {
  title: string | ReactNode
  paragraph: string | ReactNode
  examples: Example[]
}

const ExampleAppsSection = ({ title, paragraph, examples }: Props) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  return (
    <LazyMotion features={domAnimation}>
      <SectionContainer className="flex flex-col gap-12">
        <div className="flex flex-col text-center gap-4 items-center justify-center">
          <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">{title}</h2>
          <p className="mx-auto text-scale-900 lg:w-1/2">{paragraph}</p>
        </div>
        <div
          ref={ref}
          className="relative mx-auto w-full max-w-5xl grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
        >
          {examples.map((example, i) => {
            return (
              <ExampleCard example={example} isInView={isInView} index={i} key={example.title} />
            )
          })}
        </div>
      </SectionContainer>
    </LazyMotion>
  )
}

const ExampleCard = ({
  example,
  index,
  isInView,
}: {
  example: Example
  index: number
  isInView: boolean
}) => {
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ delay: index * 0.1 })

  return (
    <m.div initial={initial} animate={isInView ? animate : initial} className="flex">
      <InteractiveShimmerCard
        outerClassName="w-full"
        innerClassName="p-4 md:p-8 h-full !bg-scale-200"
      >
        <div className="h-full flex flex-col gap-4 items-start justify-between">
          <div className="prose">
            <div className="flex items-center gap-2">
              <svg
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={example.icon} fillRule="evenodd" fill="var(--colors-scale11)" />
              </svg>
              <h4 className="text-base sm:text-lg m-0">{example.title}</h4>
            </div>
            <p className="text-sm text-scale-900 mt-2">{example.description}</p>
          </div>
          {example.cta &&
            (example.cta.isDisabled ? (
              <Button size="tiny" type="default" disabled className="justify-end">
                {example.cta.label ?? 'View example'}
              </Button>
            ) : (
              <Link href={example.cta.link}>
                <a target="_blank">
                  <Button size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                    {example.cta.label ?? 'View example'}
                  </Button>
                </a>
              </Link>
            ))}
        </div>
      </InteractiveShimmerCard>
    </m.div>
  )
}

export default ExampleAppsSection
