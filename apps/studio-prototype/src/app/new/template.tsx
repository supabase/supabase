'use client'

import { motion } from 'framer-motion'

// export const pageVariants = {
//   initial: {
//     opacity: 0,
//     y: 50,
//   },
//   in: {
//     opacity: 1,
//     y: 0,
//   },
//   out: {
//     opacity: 0,
//     y: -50,
//   },
// }

// export const pageTransition = {
//   type: 'tween',
//   ease: 'anticipate',
//   duration: 2,
// }

export default function Transition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ ease: 'easeInOut', duration: 0.2 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}
