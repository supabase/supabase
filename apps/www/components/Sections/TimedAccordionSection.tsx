import 'swiper/css'

import React, { useState, useEffect, useRef } from 'react'
import { LazyMotion, domAnimation, m, useAnimation, useInView } from 'framer-motion'
import { cn } from 'ui'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useBreakpoint } from 'common'

interface TabProps {
  label: string | React.ReactNode
  paragraph?: string | React.ReactNode
  isActive: boolean
  onClick: VoidFunction
  progress: number | undefined
  intervalDuration?: number
}

const Tab = ({ isActive, label, paragraph, onClick, progress, intervalDuration }: TabProps) => {
  const paragraphRef = useRef<HTMLParagraphElement | null>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  useEffect(() => {
    if (!paragraphRef) return
    setHeight(isActive ? paragraphRef.current?.clientHeight ?? 0 : 0)
  }, [isActive])

  return (
    <button
      onClick={onClick}
      className={cn(
        'hover:text-foreground w-full text-left text-lg flex flex-col group transition-all',
        isActive ? 'text-foreground' : 'text-foreground-light'
      )}
      aria-selected={isActive}
      role="tab"
    >
      <div className="flex flex-col py-4">
        <h3 className="font-mono text-sm uppercase">{label}</h3>
        <div
          className={cn(
            'text-foreground-lighter text-sm inline-block overflow-hidden transition-all',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{ height: isActive ? `${height}px` : 0 }}
        >
          <p ref={paragraphRef} className="pt-2">
            {paragraph}
          </p>
        </div>
      </div>
      <div className="relative w-full h-[1px] bg-border-strong opacity-80 group-hover:opacity-100 rounded-full overflow-hidden">
        <LazyMotion features={domAnimation}>
          {isActive && (
            <m.div
              className={cn(
                'absolute inset-0 w-full right-full bg-foreground h-full transition-opacity',
                progress! > 99.7 ? 'opacity-0' : 'opacity-100'
              )}
              style={{ x: `${progress! - 100}%` }}
              transition={{ duration: intervalDuration }}
            />
          )}
        </LazyMotion>
      </div>
    </button>
  )
}

interface Tab {
  label: string | React.ReactNode
  paragraph?: string | React.ReactNode
  panel?: JSX.Element
  code?: string
}

interface Props {
  tabs: Tab[]
  intervalDuration?: number
  updateFrequency?: number
}

const TimedAccordionSection = ({ tabs, intervalDuration = 25, updateFrequency = 10 }: Props) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%' })
  const [activeTab, setActiveTab] = useState(0)
  const [progress, setProgress] = useState(0)
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const controls = useAnimation()
  const isMobile = useBreakpoint()

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
  }, [activeTab, controls, isInView])

  useEffect(() => {
    if (progress >= 100.9) {
      setActiveTab((prevActiveTab) => (prevActiveTab === tabs.length - 1 ? 0 : prevActiveTab + 1))
    }
  }, [progress])

  const handleTabClick = (tabIndex: number) => {
    // Disable trigger if tab is already active
    if (tabIndex === activeTab) return
    restartInterval(tabIndex)
  }

  return (
    <div ref={ref} className="flex flex-col lg:flex-row gap-8 xl:gap-24 justify-between">
      <div className="lg:w-1/3 gap-1 flex flex-col items-start" role="tablist">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            isActive={index === activeTab}
            label={tab.label}
            paragraph={tab.paragraph}
            onClick={() => handleTabClick(index)}
            progress={index === activeTab ? progress : undefined}
            intervalDuration={intervalDuration}
          />
        ))}
      </div>
      <div className="relative w-full lg:flex-1 min-h-[400px] md:overflow-hidden -mt-4">
        <Swiper
          // @ts-ignore
          onSwiper={setApiSwiper}
          style={{ zIndex: 0, marginRight: '1px', overflow: 'visible' }}
          initialSlide={activeTab}
          spaceBetween={20}
          onSlideChange={(s) => handleTabClick(s.activeIndex)}
          slidesPerView={1}
          speed={300}
          allowTouchMove={isMobile}
        >
          {tabs.map((tab, i) => (
            <SwiperSlide key={i} className="md:p-4">
              {tab.panel}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default TimedAccordionSection
