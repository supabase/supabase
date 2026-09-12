import type { Variants } from 'framer-motion'

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

const STAGGER_AFTER_CONTAINER = 0.2
const STAGGER_BETWEEN_CARDS = 0.08

export interface PlanCardsEntryAnimation {
  container: { variants?: Variants; initial?: string; animate?: string }
  card: Variants | undefined
}

export function getPlanCardsEntryAnimation(
  entryDelay: number | undefined
): PlanCardsEntryAnimation {
  if (entryDelay === undefined) return { container: {}, card: undefined }

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
