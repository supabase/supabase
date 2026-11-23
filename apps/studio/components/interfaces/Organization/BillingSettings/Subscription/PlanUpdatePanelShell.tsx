import { ArrowLeftIcon, ArrowUpRightIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Button, cn } from 'ui'

interface FullScreenPanelProps {
  /** Skips the overlay fade-in, e.g. when the panel is the landing view of a URL. */
  skipOverlayFade?: boolean
  /** Seconds to delay the content entrance animation by. */
  contentDelay?: number
  backDisabled?: boolean
  onBack: () => void
  contentClassName?: string
  children: ReactNode
}

/**
 * Full screen container used by every step of the plan update flow, so each step
 * reads as the same surface rather than a modal stacked on top of another view.
 */
export function FullScreenPanel({
  skipOverlayFade = false,
  contentDelay = 0,
  backDisabled = false,
  onBack,
  contentClassName,
  children,
}: FullScreenPanelProps) {
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
        onClick={onBack}
        disabled={backDisabled}
        className="fixed top-4 left-4 z-10"
      >
        Back
      </Button>
      <motion.div
        className={cn(
          'mx-auto flex w-full flex-col gap-4 px-6 py-16 items-center',
          contentClassName
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: contentDelay, duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

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
    <FullScreenPanel
      skipOverlayFade={skipOverlayFade}
      contentDelay={contentDelay}
      onBack={onClose}
      contentClassName="max-w-7xl"
    >
      <h1 className="text-2xl text-center text-balance max-w-2/3">
        Change subscription plan for {organizationName}
      </h1>
      {notice}
      {children}
      <div className="flex justify-center gap-2">
        <Button asChild variant="secondary" iconRight={<ArrowUpRightIcon />}>
          <a href="https://supabase.com/pricing#compare-plans" target="_blank" rel="noreferrer">
            Compare plans
          </a>
        </Button>
        <Button asChild iconRight={<ArrowUpRightIcon />}>
          <a href="https://supabase.com/pricing#faq" target="_blank" rel="noreferrer">
            Pricing FAQ
          </a>
        </Button>
      </div>
    </FullScreenPanel>
  )
}
