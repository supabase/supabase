import React, { useState, useEffect, ReactNode } from 'react'
import { motion, useAnimation } from 'framer-motion'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Link from 'next/link'
import { Button } from 'ui'
import CodeBlock from '../CodeBlock/CodeBlock'
import { Swiper, SwiperSlide } from 'swiper/react'

interface TabProps {
  label: string
  isActive: boolean
  onClick: VoidFunction
  progress: number | undefined
  intervalDuration?: number
}

const Tab = ({ isActive, label, onClick, progress, intervalDuration }: TabProps) => (
  <button
    onClick={onClick}
    className={`text-left text-lg flex flex-col group gap-1 transition-all ${
      // isActive ? 'grow-[1]' : 'grow-[0.5]'
      isActive ? 'flex-[2] text-scale-1200' : 'flex-[1] text-scale-1100'
    }`}
    aria-selected={isActive}
    role="tab"
  >
    <div className="w-full h-[2px] bg-scale-700 group-hover:bg-scale-800 rounded-full overflow-hidden">
      <motion.div
        className="bg-brand-900 h-full"
        style={{ width: `${isActive ? progress : 0}%` }}
        transition={{ duration: intervalDuration }}
      />
    </div>
    {label}
  </button>
)

interface Tab {
  label: string
  panel?: JSX.Element
  code?: string
}

interface Props {
  title: string | ReactNode
  paragraph: string
  cta?: {
    label?: string
    link: string
  }
  tabs: Tab[]
  intervalDuration?: number
  updateFrequency?: number
}

const TimedTabsSection = ({
  title,
  paragraph,
  cta,
  tabs,
  intervalDuration = 25,
  updateFrequency = 10,
}: Props) => {
  const [activeTab, setActiveTab] = useState(0)
  const [progress, setProgress] = useState(0)
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const [intervalId, setIntervalId] = useState<any>(null)
  const controls = useAnimation()

  useEffect(() => {
    if (!apiSwiper) return
    // @ts-ignore
    apiSwiper.slideTo(activeTab)
  }, [activeTab])

  const startInterval = () => {
    const interval = setInterval(() => {
      setActiveTab((prevActiveTab) => (prevActiveTab === tabs.length - 1 ? 0 : prevActiveTab + 1))
    }, intervalDuration * 1000)
    setIntervalId(interval)
  }

  const restartInterval = (tabIndex: number) => {
    clearInterval(intervalId)
    setProgress(0)
    startInterval()
    setActiveTab(tabIndex)
  }

  useEffect(() => {
    // const interval = setInterval(() => {
    //   setActiveTab((prevActiveTab) => (prevActiveTab === tabs.length - 1 ? 0 : prevActiveTab + 1))
    // }, intervalDuration * 1000) // Change tab every x seconds

    startInterval()

    return () => clearInterval(intervalId)
  }, [tabs.length, intervalDuration])

  const animation = {
    width: '100%',
    transition: { duration: intervalDuration, ease: 'linear' },
  }

  useEffect(() => {
    const progressIncrement = (100 / intervalDuration) * (updateFrequency / 1000)

    controls.start(animation)

    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => (prevProgress + progressIncrement) % 101)
    }, updateFrequency)

    return () => {
      clearInterval(progressInterval)
      setProgress(0)
    }
  }, [activeTab, controls])

  const handleTabClick = (tabIndex: number) => {
    restartInterval(tabIndex)
  }

  return (
    <SectionContainer className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 justify-between">
        <div className="w-full lg:w-1/2 gap-2 flex flex-col">
          <h2 className="text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
            {title}
          </h2>
          <p className="text-scale-900 mb-4 max-w-sm">{paragraph}</p>
          {cta && (
            <Link href={cta.link}>
              <a className="">
                <Button type="default" size="tiny">
                  {cta.label ?? 'Explore more'}
                </Button>
              </a>
            </Link>
          )}
        </div>
        <div className="w-full lg:w-1/2 min-h-[300px]">
          <Swiper
            // @ts-ignore
            onSwiper={setApiSwiper}
            style={{ zIndex: 0, marginRight: '1px' }}
            initialSlide={activeTab}
            spaceBetween={0}
            slidesPerView={1}
            speed={300}
            allowTouchMove={false}
            autoHeight={true}
          >
            {tabs.map((tab, i) => (
              <SwiperSlide key={i}>
                <CodeBlock key={i} lang="py" size="large" background="#1A1A1A">
                  {tab.code}
                </CodeBlock>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      <div className="w-full col-span-full flex gap-4 lg:gap-8 xl:gap-10" role="tablist">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            isActive={index === activeTab}
            label={tab.label}
            onClick={() => handleTabClick(index)}
            progress={index === activeTab ? progress : undefined}
            intervalDuration={intervalDuration}
          />
        ))}
      </div>
    </SectionContainer>
  )
}

export default TimedTabsSection
