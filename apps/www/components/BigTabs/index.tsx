import React, { ReactNode, useState } from 'react'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'

interface Tab {
  label: string
  panel: ReactNode
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
        className="relative w-full col-span-full flex justify-center pb-8 lg:pb-24 gap-2"
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
        <div className="absolute -z-10 mx-auto w-full bottom-0">
          <img
            src="/images/index/soft-blur-grid-02.svg"
            alt="background decoration image with grid"
            className="w-full h-auto"
          />
        </div>
      </div>
      <div className="w-full aspect-video">
        <AnimatePresence exitBeforeEnter>
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
  <button
    onClick={onClick}
    className={`text-left py-2 px-4 lg:py-4 lg:px-10 border rounded-xl bg-[var(--color-panel-bg)] text-lg opacity-80 transition-all ${
      isActive ? 'opacity-100 border-white shadow-2xl' : 'opacity-80 shadow-none'
    }`}
    aria-selected={isActive}
    role="tab"
  >
    {label}
  </button>
)

export default BigTabs
