import { AnimatePresence, motion } from 'framer-motion'
import SectionContainer from './Layouts/SectionContainer'
import InteractiveShimmerCard from './Panel'
import { ReactNode, useEffect, useState } from 'react'
import { DEFAULT_EASE, EASE_IN, EASE_OUT } from '../lib/animations'

interface Props {
  strings: string[]
}

const DELAY = 1.75
const TRANSITION_IN = 0.3
const TRANSITION_OUT = 0.2

const textVariants = {
  initial: {
    y: '-100%',
  },
  animate: {
    y: 0,
    transition: {
      duration: TRANSITION_IN,
      ease: EASE_OUT,
    },
  },
  exit: {
    y: '100%',
    transition: {
      duration: TRANSITION_OUT,
      ease: EASE_IN,
    },
  },
}

const UseSupabaseTo = (props: Props) => {
  const [activeStringIdx, setActiveStringIdx] = useState<number>(0)

  useEffect(() => {
    const textInterval = setInterval(() => {
      setActiveStringIdx((prevIndex) => (prevIndex >= props.strings.length - 1 ? 0 : prevIndex + 1))
    }, DELAY * 1000)

    console.log('activeStringIdx', activeStringIdx)
    return () => {
      clearInterval(textInterval)
      // setActiveStringIdx(0)
    }
  }, [activeStringIdx])

  return (
    <SectionContainer className="">
      <div className="relative z-10">
        <p className="mb-2 text-scale-1100 text-center">Use Supabase to</p>
        <div className="flex flex-col items-center overflow-hidden mt-2 !leading-tight text-2xl md:text-5xl">
          <AnimatePresence exitBeforeEnter>
            <motion.span
              initial="initial"
              animate="animate"
              exit="exit"
              key={activeStringIdx}
              variants={textVariants}
              className="stroke-text text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-scale-300"
            >
              {props.strings[activeStringIdx]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div className="absolute inset-0 md:top-[-50%] md:bottom-[-50%]">
        <img src="/images/index/soft-blur-01.png" className="w-[200%] h-full" />
      </div>
    </SectionContainer>
  )
}

export default UseSupabaseTo
