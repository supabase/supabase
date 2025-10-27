import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import { cn } from 'ui'

interface TabProps {
  label: string | JSX.Element
  isActive: boolean
  onClick: VoidFunction
}

const Tab = ({ isActive, label, onClick }: TabProps) => (
  <button
    onClick={onClick}
    className={`text-left text-lg flex flex-col group gap-1 transition-opacity flex-[1] ${
      isActive ? 'opacity-100' : 'opacity-50'
    }`}
    aria-selected={isActive}
    role="tab"
  >
    <div>{label}</div>
  </button>
)

interface Tab {
  label: string | JSX.Element
  paragraph?: string
  panel: JSX.Element
}

interface Props {
  tabs: Tab[]
  intervalDuration?: number
  updateFrequency?: number
  className?: string
}

const EnterpriseFormQuotes = ({
  tabs,
  intervalDuration = 25,
  updateFrequency = 10,
  className,
}: Props) => {
  const [activeTab, setActiveTab] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const controls = useAnimation()

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
      if (isPaused) return setProgress(0)
      setProgress((prevProgress) => (prevProgress + progressIncrement) % 101)
    }, updateFrequency)

    return () => {
      clearInterval(progressInterval)
      setProgress(0)
    }
  }, [activeTab, controls, isPaused])

  useEffect(() => {
    if (progress >= 100.9) {
      setActiveTab((prevActiveTab) => (prevActiveTab === tabs.length - 1 ? 0 : prevActiveTab + 1))
    }
  }, [progress])

  const handleTabClick = (tabIndex: number) => {
    restartInterval(tabIndex)
  }

  return (
    <div
      className={cn('flex flex-col gap-6 w-full', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* dynamic quote */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.1, delay: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.05 } }}
          className="text-foreground-lighter text-sm"
        >
          {tabs[activeTab]?.panel}
        </motion.div>
      </AnimatePresence>
      {/* progress bar */}
      <div className="relative w-full h-[1px] bg-border-strong opacity-80 group-hover:opacity-100 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'absolute motion-reduce:hidden inset-0 w-full right-full bg-brand h-full transition-all',
            progress! > 99.7 ? 'opacity-0' : 'opacity-100'
          )}
          style={{ x: `${progress! - 100}%` }}
          transition={{ duration: intervalDuration }}
        />
      </div>
      {/* tabs */}
      <div className="w-full col-span-full flex gap-4 lg:gap-8 xl:gap-10" role="tablist">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            isActive={index === activeTab}
            label={tab.label}
            onClick={() => handleTabClick(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default EnterpriseFormQuotes
