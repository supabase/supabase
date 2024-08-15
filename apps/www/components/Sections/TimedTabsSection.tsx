import 'swiper/css'

import React, { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Button, IconArrowUpRight } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { Swiper, SwiperSlide } from 'swiper/react'
import Image from 'next/image'

interface TabProps {
  label: string
  paragraph?: string
  isActive: boolean
  onClick: VoidFunction
  progress: number | undefined
  intervalDuration?: number
}

const Tab = ({ isActive, label, paragraph, onClick, progress, intervalDuration }: TabProps) => (
  <button
    onClick={onClick}
    className={`text-left text-lg flex flex-col group gap-1 transition-all ${
      isActive ? 'flex-[2] text-foreground' : 'flex-[1] text-foreground-light'
    }`}
    aria-selected={isActive}
    role="tab"
  >
    <div className="relative w-full h-[2px] bg-border-strong opacity-80 group-hover:opacity-100 rounded-full overflow-hidden">
      {isActive && (
        <motion.div
          className={[
            'absolute inset-0 w-full right-full bg-brand h-full transition-opacity',
            progress! > 99.7 ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
          style={{ x: `${progress! - 100}%` }}
          transition={{ duration: intervalDuration }}
        />
      )}
    </div>
    <div className="md:h-20">
      {label}
      {isActive && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          className="hidden md:block mt-1 text-foreground-lighter text-sm"
        >
          {paragraph}
        </motion.p>
      )}
    </div>
  </button>
)

interface Tab {
  label: string
  paragraph?: string
  panel?: JSX.Element
  colabUrl: string
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

  useEffect(() => {
    if (progress >= 100.9) {
      setActiveTab((prevActiveTab) => (prevActiveTab === tabs.length - 1 ? 0 : prevActiveTab + 1))
    }
  }, [progress])

  const handleTabClick = (tabIndex: number) => {
    restartInterval(tabIndex)
  }

  return (
    <SectionContainer className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 justify-between">
        <div className="w-full lg:w-1/2 gap-2 flex flex-col items-start">
          <h2 className="text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
            {title}
          </h2>
          <p className="text-foreground-lighter mb-4 max-w-sm">{paragraph}</p>
          {cta && (
            <Button asChild type="default" size="small" icon={<IconArrowUpRight />}>
              <Link href={cta.link}>{cta.label ?? 'Explore more'}</Link>
            </Button>
          )}
        </div>
        <div className="relative w-full lg:w-1/2 min-h-[300px]">
          <Swiper
            // @ts-ignore
            onSwiper={setApiSwiper}
            style={{ zIndex: 0, marginRight: '1px' }}
            initialSlide={activeTab}
            spaceBetween={0}
            slidesPerView={1}
            speed={300}
            allowTouchMove={false}
          >
            {tabs.map((tab, i) => (
              <SwiperSlide key={i}>
                <>
                  <OpenInColab
                    colabUrl={tabs[activeTab].colabUrl}
                    className="hidden md:flex absolute top-4 right-4"
                  />
                  <CodeBlock hideCopy key={i} lang="py" size="large" background="#1A1A1A">
                    {tab.code}
                  </CodeBlock>
                </>
              </SwiperSlide>
            ))}
          </Swiper>
          <OpenInColab
            colabUrl={tabs[activeTab]?.colabUrl}
            className="flex md:hidden !relative !top-0 !right-0 mt-8 w-full justify-center"
          />
        </div>
      </div>
      <div className="w-full col-span-full flex gap-4 lg:gap-8 xl:gap-10" role="tablist">
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
      <div className="block md:hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={tabs[activeTab]?.paragraph}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.1, delay: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="text-foreground-lighter text-sm"
          >
            {tabs[activeTab]?.paragraph}
          </motion.p>
        </AnimatePresence>
      </div>
    </SectionContainer>
  )
}

const OpenInColab = ({ colabUrl, className }: { colabUrl: string; className?: string }) => (
  <Link
    href={colabUrl}
    target="_blank"
    className={[
      'flex items-center z-10 h-10 bg-surface-100 hover:bg-surface-200 hover:text-foreground-lighter text-sm text-foreground-lighter shadow-lg hover:shadow-md rounded-full py-1 px-3 gap-2',
      className,
    ].join(' ')}
  >
    <Image
      className="opacity-100 hover:opacity-80 transition-opacity contrast-[.2] filter"
      src="/images/logos/google-colaboratory.svg"
      alt="Google Colaboratory logo"
      width={30}
      height={30}
    />
    <span>Open in Colab</span>
  </Link>
)

export default TimedTabsSection
