import React from 'react'
import { motion } from 'framer-motion'

interface DotGridProps {
  rows: number
  columns: number
  count: number
}

const DotGrid: React.FC<DotGridProps> = ({ rows, columns, count }) => {
  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.01,
        delayChildren: 0.01,
      },
    },
  }

  const item = {
    hidden: { opacity: 0 },
    visible: { opacity: 0.3 },
  }

  const highlightedVariants = {
    visible: {
      opacity: [1, 0.5, 1],
      transition: {
        repeat: Infinity,
        duration: 0.5,
        repeatDelay: 1.5,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <div className="relative w-full h-full min-h-[600px]">
      <motion.div
        className="grid h-full md:w-full aspect-square justify-between items-space-between items-start"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1px)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          rowGap: 'auto',
        }}
        variants={container}
        initial="hidden"
        animate="visible"
        aria-label={`Grid of ${rows * columns} dots, ${count} highlighted`}
      >
        {Array.from({ length: rows * columns }).map((_, index) => {
          const isHighlighted = index < count
          return (
            <motion.div
              key={index}
              variants={isHighlighted ? highlightedVariants : item}
              className="w-[2px] h-[2px] dark:w-[1px] dark:h-[1px] rounded-full bg-foreground-lighter"
            />
          )
        })}
        <div className="absolute bg-gradient-to-b lg:bg-gradient-to-r inset-0 w-full h-full from-background to-transparent to-40%" />
        <div className="absolute bg-gradient-to-t lg:bg-gradient-to-l inset-0 w-full h-full from-background to-transparent to-20%" />
      </motion.div>
    </div>
  )
}

export default DotGrid
