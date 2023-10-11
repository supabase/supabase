import React, { ReactNode, useEffect, useRef } from 'react'
import Link from 'next/link'
import { range } from 'lodash'
import { Button, cn } from 'ui'
import { Partner } from '~/types/partners'
import SectionContainer from '~/components/Layouts/SectionContainer'
import InteractiveShimmerCard from '~/components/InteractiveShimmerCard'
import Image from 'next/image'
import styles from './integrations.module.css'

interface CTA {
  label?: string
  link: string
  isDisabled?: boolean
}
interface Props {
  label?: string
  title: string | ReactNode
  integrations: Partner[]
  cta?: CTA
  experts: {
    paragraph?: string | ReactNode
    cta: CTA
  }
}

const Integrations = ({ title, label, cta, integrations, experts }: Props) => {
  const ref = useRef(null)

  const handleCursor = (event: any) => {
    if (!ref.current) return null

    const element = ref.current as HTMLDivElement
    const { x: elX, y: elY, width, height } = element.getBoundingClientRect()
    const x = event.clientX - elX
    const y = event.clientY - elY

    element.style.setProperty('--x', x + 'px')
    element.style.setProperty('--y', y + 'px')

    console.log(x, y)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('mousemove', handleCursor)
    return () => {
      window.removeEventListener('mousemove', handleCursor)
    }
  }, [])

  return (
    <div id="integrations">
      <SectionContainer className="!pb-0">
        <div className="-mt-20 lg:-mt-8">
          <div
            ref={ref}
            className="relative h-[320px] w-full max-w-[400vw] md:left-0 mx-auto md:w-full -mb-20 z-0"
          >
            <Image
              src="/images/index/integrations/integrations-02.jpg"
              alt="Integrations grid"
              layout="fill"
              objectFit="contain"
              quality={100}
              className={cn('absolute z-20', styles['reveal-mask'])}
            />
            <Image
              src="/images/index/integrations/integrations-01.jpg"
              alt="Integrations grid"
              layout="fill"
              objectFit="contain"
              quality={100}
              className="absolute animate-pulse"
            />
          </div>
          <div className="relative z-10 flex flex-col text-center gap-4 items-center justify-center">
            <div className="px-3 py-2 rounded-full bg-surface-300 shadow-lg flex items-center justify-center text-foreground text-sm">
              {label}
            </div>
            <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">{title}</h2>
            {cta && (
              <Link href={cta.link} passHref>
                <Button size="medium" type="default" asChild>
                  <a className="mt-4">{cta.label}</a>
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div
          className="relative my-8 lg:my-20 w-full group/integrations overflow-hidden flex flex-row gap-4 nowrap
            before:content[''] before:absolute before:inset-0 before:w-full before:bg-[linear-gradient(to_right,var(--colors-scale2)_0%,transparent_10%,transparent_90%,var(--colors-scale2)_100%)] before:z-10 before:pointer-events-none
          "
        >
          {range(0, 2).map((_, idx1: number) => (
            <div
              key={`integrations-col-${idx1}`}
              className="flex run animate-marquee group-hover/integrations:pause will-change-transform transition-transform gap-4"
            >
              {integrations?.map((p) => (
                <Link key={p.slug} href={`/partners/${p.slug}`}>
                  <a>
                    <InteractiveShimmerCard
                      hasActiveOnHover
                      outerClassName="bg-transparent"
                      innerClassName="px-6 py-6 flex flex-col justify-between h-full w-[230px] aspect-square"
                    >
                      <div className="flex gap-2 items-stretch">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden transition-all group-hover:scale-110">
                          <Image layout="fill" objectFit="cover" src={p.logo} alt={p.title} />
                        </div>
                        <p className="text-scale-1100 m-0 bg-surface-200 rounded-lg flex items-center justify-center p-2 h-full grow text-base">
                          {p.title}
                        </p>
                      </div>
                      <p className="text-lighter text-sm line-clamp-2" title={p.description}>
                        {p.description}
                      </p>
                    </InteractiveShimmerCard>
                  </a>
                </Link>
              ))}
            </div>
          ))}
        </div>
        <SectionContainer className="!pt-0 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-center text-sm text-foreground-light">{experts.paragraph}</p>{' '}
          {experts.cta && (
            <Link href={experts.cta.link} passHref>
              <Button type="default" asChild>
                <a>{experts.cta.label}</a>
              </Button>
            </Link>
          )}
        </SectionContainer>
      </SectionContainer>
    </div>
  )
}

export default Integrations
