export const DEFAULT_EASE = [0.24, 0.25, 0.05, 1]
export const DEFAULT_DURATION = 0.4
export const DEFAULT_DELAY = 0
export const DEFAULT_TRANSITION = { ease: DEFAULT_EASE, duration: DEFAULT_DURATION }

interface AnimationProps {
  delay?: number
  duration?: number
  ease?: number
}

export const INITIAL_BOTTOM = { opacity: 0, y: 20 }
export const getAnimation = ({ delay, duration, ease }: AnimationProps) => ({
  opacity: 1,
  y: 0,
  transition: {
    delay: delay ?? DEFAULT_DELAY,
    ease: ease ?? DEFAULT_EASE,
    duration: duration ?? DEFAULT_DURATION,
  },
})
