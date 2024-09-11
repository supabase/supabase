import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge, cn } from 'ui'

export type Tab = {
  label: string
  panel: React.FC
}

interface Props {
  tabs: Tab[]
}

const BigTabs = (props: Props) => {
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0)

  const Panel: any = props.tabs[activeTabIdx]?.panel ?? null

  const handleTabClick = (tabIndex: number) => {
    setActiveTabIdx(tabIndex)
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full col-span-full flex justify-center pb-8 lg:pb-32 gap-2"
        role="tablist"
      >
        {props.tabs.map((tab, index) => (
          <Tab
            key={index}
            isActive={index === activeTabIdx}
            label={tab.label}
            onClick={() => handleTabClick(index)}
          />
        ))}
        {/* <div className="absolute -z-10 mx-auto w-full bottom-0">
          <img
            src="/images/index/dashboard/soft-blur-grid-02.svg"
            alt="background decoration image with grid"
            className="w-full h-auto opacity-30"
          />
        </div> */}
      </div>
      <div className="w-full aspect-video">
        <AnimatePresence mode="wait">
          <motion.div
            key={props.tabs[activeTabIdx]?.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.1, delay: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
          >
            <Panel />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

interface TabProps {
  label: string
  isActive: boolean
  onClick: VoidFunction
}

const Tab = ({ label, isActive, onClick }: TabProps) => (
  <button onClick={onClick} aria-selected={isActive} role="tab">
    <Badge
      size="large"
      className={cn(
        // `text-left py-1.5 px-3 lg:py-2 lg:px-8 border rounded-md bg-alternative hover:border-foreground text-lg opacity-80 transition-all`,
        'py-1.5 px-3 lg:py-2 lg:px-8',
        'hover:border-foreground-lighter hover:text-foreground',
        `opacity-80`,
        isActive ? 'opacity-100 !border-foreground' : ''
      )}
    >
      {label}
    </Badge>
  </button>
)

export default BigTabs
