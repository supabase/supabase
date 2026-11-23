import type { Variants } from 'motion/react'

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

const STAGGER_AFTER_CONTAINER = 0.2
const STAGGER_BETWEEN_CARDS = 0.08

export interface PlanCardsEntryAnimation {
  container: { variants: Variants; initial: string; animate: string }
  card: Variants
}

export function getPlanCardsEntryAnimation(entryDelay: number): PlanCardsEntryAnimation {
  return {
    container: {
      variants: {
        hidden: {},
        visible: {
          transition: {
            delayChildren: entryDelay + STAGGER_AFTER_CONTAINER,
            staggerChildren: STAGGER_BETWEEN_CARDS,
          },
        },
      },
      initial: 'hidden',
      animate: 'visible',
    },
    card: CARD_VARIANTS,
  }
}

export const getLiftedSide = ({
  index,
  liftedIndex,
}: {
  index: number
  liftedIndex: number
}): 'left' | 'right' | undefined => {
  // findIndex gives -1 when no card is lifted, so index 0 must not count as its neighbor
  if (liftedIndex === -1) return undefined
  if (index === liftedIndex - 1) return 'right'
  if (index === liftedIndex + 1) return 'left'
  return undefined
}
