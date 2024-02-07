import { type Variants, motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'

import { IconCheck, IconDiscussions, IconX, cn } from 'ui'

type Response = 'yes' | 'no'

const buttonClasses = cn(
  'inline-flex items-center justify-center py-1 px-1',
  'text-center font-regular text-foreground text-xs',
  'ease-out duration-200 transition-all',
  'rounded-md border border-strong hover:border-stronger bg-transparent',
  'outline-none focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-border-strong'
)

const yesVariants: Variants = {
  yes: {
    opacity: 1,
  },
  no: {
    opacity: 0,
    transitionEnd: {
      visibility: 'hidden',
    },
  },
  default: {
    opacity: 1,
  },
}

function createNoVariants(reducedMotion: boolean): Variants {
  return {
    yes: {
      opacity: 0,
      transitionEnd: {
        visibility: 'hidden',
      },
    },
    no: {
      opacity: 1,
      ...(reducedMotion
        ? null
        : {
            translateX: 'calc(-1 * (100% + 0.5rem))',
            transition: {
              translateX: {
                delay: 0.3,
                duration: 0.5,
                type: 'tween',
              },
            },
          }),
    },
    default: {
      opacity: 1,
    },
  }
}

const feedbackVariants: Variants = {
  yes: {
    opacity: 1,
  },
  no: {
    opacity: 1,
    // better coordination with sliding x button
    transition: {
      delay: 0.1,
    },
  },
  default: {
    opacity: 0,
    visibility: 'hidden',
  },
}

function Feedback() {
  const [response, setResponse] = useState<Response | null>(null)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()

  const isYes = response === 'yes'
  const isNo = response === 'no'
  const animate = isYes ? 'yes' : isNo ? 'no' : 'default'

  const noVariants = useMemo(() => createNoVariants(reducedMotion), [reducedMotion])

  function handleResponse(response: Response) {
    setResponse(response)
    feedbackButtonRef.current?.focus()
  }

  return (
    <>
      <div className="relative flex gap-2 items-center mb-2">
        <motion.button
          className={cn(
            buttonClasses,
            'hover:text-brand-600',
            isYes && 'text-brand-600 border-stronger'
          )}
          onClick={() => handleResponse('yes')}
          variants={yesVariants}
          animate={animate}
        >
          <IconCheck />
          <span className="sr-only">Yes</span>
        </motion.button>
        <motion.button
          className={cn(
            buttonClasses,
            'hover:text-warning-600',
            isNo && 'text-warning-600 border-stronger'
          )}
          onClick={() => handleResponse('no')}
          variants={noVariants}
          animate={animate}
        >
          <IconX />
          <span className="sr-only">No</span>
        </motion.button>
      </div>
      <motion.button
        ref={feedbackButtonRef}
        className={cn('flex items-center gap-2', 'text-[0.8rem] text-foreground-lighter')}
        variants={feedbackVariants}
        animate={animate}
      >
        {isYes ? <>What went well?</> : <>How can we improve?</>}
        <IconDiscussions size="tiny" />
      </motion.button>
    </>
  )
}

export { Feedback }
