import { motion } from 'framer-motion'

interface DotGridProps {
  rows: number
  columns: number
  count: number
}

const DotGrid = ({ rows, columns, count }: DotGridProps) => {
  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0 },
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
    <div
      className="relative w-full h-full"
      style={{
        maskImage: 'linear-gradient(to bottom, black, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
      }}
    >
      <motion.div
        className="grid w-full h-full justify-between items-space-between items-start"
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
              variants={item}
              className={`w-[1px] h-[1px] rounded-full bg-foreground`}
            />
          )
        })}
      </motion.div>
    </div>
  )
}

export default DotGrid
