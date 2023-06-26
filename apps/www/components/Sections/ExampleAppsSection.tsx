import React, { ReactNode, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import { Button, IconArrowUpRight } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
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
  frameworks: any[]
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
        <div className="relative -z-10 w-full aspect-[1.83/1] -mb-[50px] lg:-mb-[100px] -mt-[200px] lg:-mt-[350px]">
          <Image
            src="/images/index/energy-visual.svg"
            alt=""
            layout="fill"
            objectFit="contain"
            quality={100}
          />
          <Image
            src="/images/index/gradient-bg.png"
            alt=""
            layout="fill"
            objectFit="contain"
            quality={100}
            className="absolute rotate-180 -z-10"
          />
        </div>
        <div className="flex flex-col text-center gap-4 items-center justify-center">
          <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">{title}</h2>
          <p className="mx-auto text-scale-900 lg:w-1/2">{paragraph}</p>
        </div>
        <div
          ref={ref}
          className="relative mx-auto w-full max-w-5xl grid gap-4 lg:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
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
    <Link href={example.cta!.link!}>
      <a target="_blank" className="group">
        <m.div initial={initial} animate={isInView ? animate : initial} className="flex">
          <div className="w-full h-full flex flex-col gap-4 items-start justify-between">
            <div className="relative bg-[var(--color-panel-bg)] rounded-lg w-full aspect-video">
              <div className="absolute  left-4 bottom-4">
                {example.frameworks?.map((framework) => (
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-[hsl(var(--color-base-400))] shadow-md">
                    <Image
                      key={framework.name}
                      src={framework.icon}
                      alt={framework.name}
                      width={24}
                      height={24}
                    />
                  </div>
                ))}
              </div>
              {example.img && (
                <Image src={example.img} alt={example.title} layout="fill" objectFit="cover" />
              )}
            </div>
            <div className="prose">
              <div className="flex items-center gap-2">
                <h4 className="text-base m-0 opacity-80 group-hover:opacity-100">
                  {example.title}
                </h4>
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
        </m.div>
      </a>
    </Link>
  )
}

export default ExampleAppsSection
