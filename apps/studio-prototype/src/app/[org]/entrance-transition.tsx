'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function EntranceTransition({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <motion.div
        initial={{ x: 30, opacity: 0, scale: 1 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        // exit={{ x: 6, opacity: 0 }}
        transition={{ ease: 'easeInOut', duration: 0.15, delay: 0.9 }}
        className="flex w-full h-full"
      >
        {children}
      </motion.div>
      {/* <motion.div
        initial={{ x: 6, opacity: 0, scale: 0.99 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{ ease: 'easeInOut', duration: 0.3 }}
        className="absolute left-0 top-0 w-screen h-screen flex"
      >
        <div className="absolute z-30 h-screen w-screen flex justify-center items-center bg-black/40">
          <Loader2 size={21} className="animate-spin duration-500 text-foreground-muted" />
        </div>
      </motion.div> */}
    </>
  )
}
