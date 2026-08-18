import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Enter/exit for a form section that appears in response to a toggle further up
 * the form. Animates height and opacity so pushed siblings slide rather than
 * snap. Wrap the parent in `<AnimatePresence initial={false}>` so a section
 * already open on mount doesn't animate in on first paint, and give each child
 * a stable `key`.
 *
 * `overflow` is hidden only while the height is animating — otherwise focus
 * rings on nested inputs get clipped by the wrapper.
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
