import React, { ReactNode, useEffect, useState } from 'react'
import SectionContainer from '../Layouts/SectionContainer'
import { Button, IconArrowUpRight, cn } from 'ui'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface Props {
  id?: string
  title: string | ReactNode
  paragraph?: string
  cta?: {
    label?: string
    link: string
  }
  content?: string
  className?: string
  hasStickyTitle?: boolean
}

const GaPerformanceSection = ({
  id,
  title,
  content,
  cta,
  paragraph,
  className,
  hasStickyTitle,
}: Props) => {
  // Update with new data
  const PerformanceComparisonData = [
    {
      key: 'read',
      title: 'Read (requests/s)',
      stats: [
        { name: 'Supabase', value: 1167 },
        { name: 'Firestore', value: 366 },
      ],
    },
    {
      key: 'write',
      title: 'Write (requests/s)',
      stats: [
        { name: 'Supabase', value: 870 },
        { name: 'Firestore', value: 280 },
      ],
    },
  ]

  const Bar = (props: any) => {
    const { color, finalPercentage, duration = 2000 } = props
    const countTo = parseInt(finalPercentage, 10)
    const [count, setCount] = useState<number>(0)
    const [animTriggered, setAnimTriggered] = useState<boolean>(false)

    const easeOutQuad = (t: number) => t * (2 - t)
    const frameDuration = 1000 / 60

    useEffect(() => {
      let frame = 0
      const totalFrames = Math.round(duration / frameDuration)

      async function handleScroll() {
        const reference = document.getElementById('performanceCharts')
        if (reference && !animTriggered) {
          const yOffset = reference.getBoundingClientRect().top - window.innerHeight + 20
          if (yOffset <= 0) {
            setAnimTriggered(true)
            setCount(0)
            const counter = setInterval(() => {
              frame++
              const progress = easeOutQuad(frame / totalFrames)
              setCount(countTo * progress)

              if (frame === totalFrames) clearInterval(counter)
            }, frameDuration)
          }
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }, [animTriggered])

    return <div className={`${color} h-3 rounded-full`} style={{ width: `${count.toFixed(2)}%` }} />
  }

  const ComparisonChart = ({ className }: { className?: string }) => {
    const maxValue = 1600
    return (
      <div id="performanceCharts" className={cn(className)}>
        {PerformanceComparisonData.map((metric: any) => {
          const multiplier = (metric.stats[0].value / metric.stats[1].value).toFixed(1)
          return (
            <div key={`${metric.key}`} className="mb-10 text-foreground-light">
              <p className="pb-2 mb-4 sm:w-36">{metric.title}</p>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="w-full sm:w-5/6">
                  {metric.stats.map((stat: any, idx: number) => (
                    <div key={`metric_${metric.key}_${idx}`} className="flex items-center">
                      <p className="w-20 py-2 pr-4 mr-4 text-left border-r sm:text-right lg:w-24">
                        {stat.name}
                      </p>
                      <Bar
                        color={stat.name === 'Supabase' ? 'bg-brand' : 'bg-brand-400'}
                        finalPercentage={Math.ceil((stat.value / maxValue) * 100)}
                      />
                      <p className="ml-2">{stat.value}/s</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col text-left sm:w-1/6 sm:text-right">
                  <p className="text-4xl text-foreground-lighter">{multiplier}x</p>
                  <p className="-mt-2 text-sm">more {metric.key}s per second</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <SectionContainer id={id} className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 xl:gap-10 justify-between">
        <div className="col-span-full lg:col-span-4 gap-2 flex flex-col items-start">
          <div className={cn('gap-2 flex flex-col items-start', hasStickyTitle && 'sticky top-24')}>
            <h2 className="text-2xl sm:text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
              {title}
            </h2>
            <p className="text-lighter mb-4">{paragraph}</p>
            {cta && (
              <Button asChild type="default" size="small" icon={<IconArrowUpRight />}>
                <Link href={cta.link}>{cta.label ?? 'Explore documentation'}</Link>
              </Button>
            )}
          </div>
        </div>
        {content && (
          <div className="col-span-full lg:col-start-6 lg:col-span-7">
            <ReactMarkdown className="prose text-foreground-light">{content}</ReactMarkdown>
            <ComparisonChart className="mt-8 md:mt-16" />
          </div>
        )}
      </div>
    </SectionContainer>
  )
}

export default GaPerformanceSection
