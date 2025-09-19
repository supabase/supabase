import { Variants } from 'framer-motion'

export const expandVariants: Variants = {
  initial: {
    opacity: 0,
    height: 0,
    scale: 0.98,
    y: -10,
  },
  animate: {
    opacity: 1,
    height: 'auto',
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      staggerChildren: 0.1,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    scale: 0.98,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
}

export const collapseVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeInOut',
    },
  },
}

export const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

export const cardExpandVariants: Variants = {
  collapsed: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  expanded: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
}