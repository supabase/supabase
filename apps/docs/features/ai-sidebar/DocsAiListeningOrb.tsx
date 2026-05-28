'use client'

import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const Persona = dynamic(
  () => import('./Persona').then((mod) => ({ default: mod.Persona })),
  { ssr: false }
)

function DocsAiListeningOrb({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none absolute inset-x-0 bottom-full z-10 mb-5 flex justify-center"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="docs-ai-listening-orb"
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Persona state="listening" variant="obsidian" className="size-16" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { DocsAiListeningOrb }
