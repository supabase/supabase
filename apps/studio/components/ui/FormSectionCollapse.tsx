import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Provides enter/exit animation for a form section that appears in response to a toggle in the form.
 * Wrap the parent in `<AnimatePresence initial={false}>` to avoid animation on first paint.
 */
export const FormSectionCollapse = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial="collapsed"
    animate="open"
    exit="collapsed"
    variants={{
      collapsed: { opacity: 0, height: 0, overflow: 'hidden' },
      open: {
        opacity: 1,
        height: 'auto',
        overflow: 'hidden',
        transitionEnd: { overflow: 'visible' },
      },
    }}
    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
)
