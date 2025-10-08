import 'swiper/css'

import React, { useState, useEffect, useRef } from 'react'
import { LazyMotion, domAnimation, m, useAnimation, useInView } from 'framer-motion'
import { cn } from 'ui'
import { Swiper, SwiperSlide } from 'swiper/react'
import Panel from '../Panel'
import { useBreakpoint } from 'common'

interface PanelProps {
  id: string
  label: string | React.ReactNode
  paragraph?: string
  icon?: React.ReactNode
  isActive?: boolean
  isInView?: boolean
  onClick?: VoidFunction
  progress?: number | undefined
  intervalDuration?: number
  image?: any
}

const TimedPanel = ({
  isActive,
  label,
  paragraph,
  onClick,
  progress,
  intervalDuration,
  image,
  isInView,
}: PanelProps) => {
  const isSm = useBreakpoint()
  const Image: any = image ?? null

  return (
    <button
      onMouseEnter={() => !isSm && onClick && onClick()}
      onClick={() => isSm && onClick && onClick()}
      className={cn(
        'relative hover:text-foreground w-full h-[500px] text-left text-lg flex flex-col group transition-all',
        isActive ? 'text-foreground md:flex-[2]' : 'text-foreground-light md:flex-[1]'
      )}
      aria-selected={isActive}
      role="tab"
    >
      <Panel outerClassName="w-full h-full mb-4" innerClassName="p-4">
        <div className="relative z-10 flex flex-col h-full justify-between">
          <h3
            className={cn(
              'font-mono text-sm uppercase transition-colors',
              isActive && 'text-foreground'
            )}
          >
            {label}
          </h3>
          <p
            className={cn(
              'pt-2 text-foreground-lighter text-sm max-w-[220px] md:opacity-0 transition-opacity lg:opacity-100',
              isActive && '!opacity-100'
            )}
          >
            {paragraph}
          </p>
        </div>
        <div
          className={cn(
            'absolute h-[calc(100%-150px)] mt-14 inset-0 m-auto flex items-center justify-center transition-opacity',
            isActive ? 'opacity-100' : 'opacity-25'
          )}
        >
          <div
            className={cn(
              'absolute z-20 w-full h-full inset-0 bg-gradient-to-r from-transparent to-background-surface-100 transition-opacity pointer-events-none',
              isActive && 'opacity-0'
            )}
          />
          <Image isActive={isActive} isInView={isInView} />
        </div>
      </Panel>
      {!isSm && isActive && (
        <div className="opacity-0 animate-fade-in absolute bottom-0 w-full h-[1px] bg-border-strong group-hover:opacity-100 rounded-full overflow-hidden">
          <LazyMotion features={domAnimation}>
            <m.div
              className={cn(
                'absolute inset-0 w-full right-full bg-foreground h-full transition-opacity',
                progress! > 99.7 ? 'opacity-0' : 'opacity-100'
              )}
              style={{ x: `${progress! - 100}%` }}
              transition={{ duration: intervalDuration }}
            />
          </LazyMotion>
        </div>
      )}
    </button>
  )
}

interface Props {
  panels: PanelProps[]
  intervalDuration?: number
  updateFrequency?: number
  isInView?: boolean
}

const TimedAccordionPanels = ({ panels, intervalDuration = 10, updateFrequency = 10 }: Props) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%' })
  const [activeTab, setActiveTab] = useState(0)
  const [progress, setProgress] = useState(0)
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const controls = useAnimation()

  useEffect(() => {
    if (!apiSwiper) return
    // @ts-ignore
    apiSwiper.slideTo(activeTab)
  }, [activeTab])

  const restartInterval = (tabIndex: number) => {
    setProgress(0)
    setActiveTab(tabIndex)
  }

  const animation = {
    width: '100%',
    transition: { duration: intervalDuration, ease: 'linear' },
  }

  useEffect(() => {
    // pause timer when component is not in view
    if (!isInView) {
      controls.stop()
      setProgress(progress)
      return
    }

    const progressIncrement = (100 / intervalDuration) * (updateFrequency / 1000)
    controls.start(animation)
    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => (prevProgress + progressIncrement) % 101)
    }, updateFrequency)

    return () => {
      clearInterval(progressInterval)
      setProgress(0)
    }
  }, [isInView])

  useEffect(() => {
    if (progress >= 100.9) {
      setActiveTab((prevActiveTab) => (prevActiveTab === panels.length - 1 ? 0 : prevActiveTab + 1))
    }
  }, [progress])

  const handleTabClick = (tabIndex: number) => {
    // Disable trigger if tab is already active
    if (tabIndex === activeTab) return
    restartInterval(tabIndex)
  }

  return (
    <div ref={ref} className="flex flex-col gap-8 xl:gap-32 justify-between">
      <div className="hidden md:flex gap-4" role="tablist">
        {panels.map((panel, index) => (
          <TimedPanel
            key={index}
            isActive={index === activeTab}
            isInView={isInView}
            onClick={() => handleTabClick(index)}
            progress={index === activeTab ? progress : undefined}
            intervalDuration={intervalDuration}
            {...panel}
          />
        ))}
      </div>
      <div className="md:hidden relative w-full lg:w-1/2 min-h-[300px] overflow-visible">
        <Swiper
          // @ts-ignore
          onSwiper={setApiSwiper}
          style={{ zIndex: 0, overflow: 'visible' }}
          initialSlide={0}
          spaceBetween={10}
          onSlideChange={(s) => handleTabClick(s.activeIndex)}
          slidesPerView={1.1}
          speed={300}
        >
          {panels.map((panel, index) => (
            <SwiperSlide key={index}>
              <TimedPanel
                isActive={index === activeTab}
                isInView={isInView}
                onClick={() => handleTabClick(index)}
                progress={index === activeTab ? progress : undefined}
                intervalDuration={intervalDuration}
                {...panel}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default TimedAccordionPanels
