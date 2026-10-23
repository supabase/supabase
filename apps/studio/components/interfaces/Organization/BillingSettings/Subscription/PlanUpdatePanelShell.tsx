import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Button } from 'ui'

interface PlanUpdateFullScreenShellProps {
  organizationName: string | undefined
  /** Rendered above the plan cards, outside the scrollable card grid. */
  notice: ReactNode
  skipOverlayFade: boolean
  contentDelay: number
  onClose: () => void
  children: ReactNode
}

export function PlanUpdateFullScreenShell({
  organizationName,
  notice,
  skipOverlayFade,
  contentDelay,
  onClose,
  children,
}: PlanUpdateFullScreenShellProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-studio"
      initial={skipOverlayFade ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Button
        variant="text"
        icon={<ArrowLeftIcon />}
        onClick={onClose}
        className="fixed top-4 left-4 z-10"
      >
        Go back to Studio
      </Button>
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <Button
          asChild
          variant="text"
          iconRight={<ExternalLinkIcon />}
          className="hidden sm:inline-flex"
        >
          <a href="https://supabase.com/pricing#faq" target="_blank" rel="noreferrer">
            Pricing FAQ
          </a>
        </Button>
        <Button asChild iconRight={<ExternalLinkIcon />}>
          <a href="https://supabase.com/pricing#compare-plans" target="_blank" rel="noreferrer">
            Compare plans
          </a>
        </Button>
      </div>
      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-16"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: contentDelay, duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="text-2xl text-center">Change subscription plan for {organizationName}</h1>
        {notice}
        {children}
      </motion.div>
    </motion.div>
  )
}
