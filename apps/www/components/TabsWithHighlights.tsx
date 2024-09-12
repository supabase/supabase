import React, { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge, cn } from 'ui'
import BrowserFrame from './BrowserFrame'
import { Check } from 'lucide-react'

export type Tab = {
  label: string
  panel: React.FC
  highlights: { label: string; link?: string }[]
}

interface Props {
  tabs: Tab[]
}

const TabsWithHighlights = (props: Props) => {
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0)

  const Panel: any = props.tabs[activeTabIdx]?.panel ?? null
  const highlights = props.tabs[activeTabIdx]?.highlights ?? [null]

  const handleTabClick = (tabIndex: number) => {
    setActiveTabIdx(tabIndex)
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-12 items-center">
      <div className="relative w-full col-span-full flex justify-center gap-2" role="tablist">
        {props.tabs.map((tab, index) => (
          <Tab
            key={index}
            isActive={index === activeTabIdx}
            label={tab.label}
            onClick={() => handleTabClick(index)}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.ul
          key={props.tabs[activeTabIdx]?.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.1, delay: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.05 } }}
          className="position order-last lg:order-2 w-ful flex flex-wrap items-center gap-x-8 gap-y-4 lg:gap-8 justify-center text-center mx-auto z-30"
        >
          {highlights?.map((highlight) => (
            <li key={highlight.label}>
              <Link
                href={highlight.link ?? '#'}
                className="group cursor-pointer flex items-center gap-2 text-sm whitespace-nowrap text-foreground-light hover:text-foreground transition-colors hover:underline"
              >
                <Check className="stroke-2 w-4" />
                <span>{highlight.label}</span>
              </Link>
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
      <BrowserFrame
        className="overflow-hidden lg:order-last bg-default w-full max-w-7xl mx-auto"
        contentClassName="aspect-video border overflow-hidden rounded-lg"
      >
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
      </BrowserFrame>
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

export default TabsWithHighlights
