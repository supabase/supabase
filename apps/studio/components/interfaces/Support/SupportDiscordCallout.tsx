import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, IconDiscord } from 'ui'

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
      className="flex items-center gap-4 border-t border-b border-default px-6 py-3 overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle, hsl(var(--background-surface-300) / 0.75) 1px, transparent 1px)',
        backgroundSize: '8px 8px',
      }}
    >
      <div className="relative flex-1 h-5">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 block text-sm font-medium text-foreground truncate"
          >
            {statuses[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button
        asChild
        type="text"
        size="tiny"
        icon={<IconDiscord size={14} className="text-[#5865F2]" />}
        iconRight={<ExternalLink size={12} />}
        className="-mr-2"
      >
        <Link href="https://discord.supabase.com" target="_blank" rel="noreferrer">
          Discord
        </Link>
      </Button>
    </div>
  )
}
