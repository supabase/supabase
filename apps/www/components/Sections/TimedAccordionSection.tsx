import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { cn } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { Swiper, SwiperSlide } from 'swiper/react'
import Image from 'next/image'

interface TabProps {
  label: string | React.ReactNode
  paragraph?: string
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

  const variants = {
    show: { opacity: 1, height: height },
    hide: { opacity: 0, height: 0 },
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left text-lg flex flex-col group transition-all',
        isActive ? 'text-foreground' : 'text-foreground-light'
      )}
      aria-selected={isActive}
      role="tab"
    >
      <div className="flex flex-col py-4">
        <p className="font-mono text-sm uppercase">{label}</p>
        <motion.div
          variants={variants}
          initial="hide"
          exit="hide"
          animate={isActive ? 'show' : 'hide'}
          className="text-foreground-lighter text-sm inline-block overflow-hidden"
        >
          <p ref={paragraphRef} className="pt-2">
            {paragraph}
          </p>
        </motion.div>
      </div>
      <div className="relative w-full h-[1px] bg-border-strong opacity-80 group-hover:opacity-100 rounded-full overflow-hidden">
        {isActive && (
          <motion.div
            className={cn(
              'absolute inset-0 w-full right-full bg-brand h-full transition-opacity',
              progress! > 99.7 ? 'opacity-0' : 'opacity-100'
            )}
            style={{ x: `${progress! - 100}%` }}
            transition={{ duration: intervalDuration }}
          />
        )}
      </div>
    </button>
  )
}

interface Tab {
  label: string | React.ReactNode
  paragraph?: string
  panel?: JSX.Element
  code?: string
}

interface Props {
  // title: string | ReactNode
  // paragraph: string
  cta?: {
    label?: string
    link: string
  }
  tabs: Tab[]
  intervalDuration?: number
  updateFrequency?: number
}

const TimedAccordionSection = ({
  // title,
  // paragraph,
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
    <div className="flex flex-col lg:flex-row gap-8 xl:gap-32 justify-between">
      <div className="lg:w-1/2 gap-1 flex flex-col items-start" role="tablist">
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
      <div className="relative w-full lg:w-1/2 min-h-[300px] overflow-hidden">
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
                <CodeBlock hideCopy key={i} lang="py" size="large" background="#1A1A1A">
                  {tab.code}
                </CodeBlock>
              </>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
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

export default TimedAccordionSection
