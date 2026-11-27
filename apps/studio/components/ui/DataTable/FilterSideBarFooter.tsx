import { useFlag, useParams } from 'common'
import { BracesIcon, Volume1Icon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { Button, cn } from 'ui'

const ROTATE_INTERVAL_MS = 12000

interface FooterCarouselItem {
  id: string
  title: string
  description: string
  icon: ReactNode
  href: string
  linkText: string
}

export function FilterSideBarFooter() {
  const { ref } = useParams()
  const shouldReduceMotion = useReducedMotion()
  const [activeId, setActiveId] = useState<string>()
  const isLogVolumeControlsEnabled = useFlag('enableLogVolumeControls')

  const items: FooterCarouselItem[] = [
    ...(isLogVolumeControlsEnabled
      ? [
          {
            id: 'log-volume',
            title: 'Reduce log volume',
            description: 'Log only errors to cut noise and storage costs.',
            icon: <Volume1Icon size={14} strokeWidth={1.5} />,
            href: `/project/${ref}/settings/general#logs`,
            linkText: 'Go to project settings',
          },
        ]
      : []),
    {
      id: 'log-drains',
      title: 'Capture your logs',
      description: 'Send logs to your preferred observability or storage platform.',
      icon: <BracesIcon size={14} strokeWidth={1.5} />,
      href: `/project/${ref}/settings/log-drains`,
      linkText: 'Go to Log Drains',
    },
  ]

  const activeItem = items.find((item) => item.id === activeId) ?? items[0]

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentIndex = items.findIndex((item) => item.id === activeItem.id)
      const nextItem = items[(currentIndex + 1) % items.length]
      setActiveId(nextItem.id)
    }, ROTATE_INTERVAL_MS)
    return () => clearTimeout(timeout)
    // items is a new array every render; re-running on items.length covers the only case it actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem.id, items.length])

  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }

  return (
    <section
      aria-label="Suggestions"
      className="relative flex shrink-0 flex-col gap-3 border-t border-default p-3"
    >
      <div className="absolute right-3 top-4 flex items-center gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            tabIndex={0}
            aria-label={`Show "${item.title}"`}
            aria-current={item.id === activeItem.id}
            onClick={() => setActiveId(item.id)}
            className={cn(
              'h-1 overflow-hidden rounded-full bg-foreground-muted/30 transition-[width]',
              item.id === activeItem.id ? 'w-5' : 'w-1'
            )}
          >
            {item.id === activeItem.id && (
              <motion.div
                key={activeItem.id}
                className="h-full w-full origin-left bg-foreground-lighter/80"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : ROTATE_INTERVAL_MS / 1000,
                  ease: 'linear',
                }}
              />
            )}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {activeItem.title}. {activeItem.description}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={transition}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-foreground">{activeItem.title}</h3>
            <p className="text-xs text-foreground-lighter">{activeItem.description}</p>
          </div>
          <Button asChild block variant="outline" icon={activeItem.icon}>
            <Link href={activeItem.href}>{activeItem.linkText}</Link>
          </Button>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
