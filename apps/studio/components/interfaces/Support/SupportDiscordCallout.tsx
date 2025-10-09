import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MoveUpRight } from 'lucide-react'
import { IconDiscord } from 'ui'
import { motion, AnimatePresence } from 'framer-motion'

interface DynamicStatusProps {
  interval?: number
}
const statuses = [
  'Try asking on Discord! The median reply time is ~12 min',
  '75% of questions get a reply within ~54 min',
  'Get help fast on Discord — median reply time is ~12 min',
  '90% of questions get a reply within 4h 11m',
  'Discord support: 95% replied within 8h',
]

export function SupportFormDiscordCallout({ interval = 4000 }: DynamicStatusProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (statuses.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % statuses.length)
    }, interval)

    return () => clearInterval(timer)
  }, [interval])

  return (
    <div
      className="flex items-center gap-4 border-t border-b border-default px-6 py-2"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
        backgroundSize: '8px 8px',
      }}
    >
      <div className="relative flex-1 overflow-hidden h-5">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 block text-sm font-medium"
          >
            {statuses[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="ml-auto">
        <Link
          href="https://discord.supabase.com"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-1 transition-colors hover:text-[#5865F2]"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <IconDiscord className="text-[#5865F2]" />
          </motion.div>

          <MoveUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  )
}
