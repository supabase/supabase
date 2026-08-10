import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { cn, IconGitHubSolid } from 'ui'

import { formatConfigValue, type GitHubConfigFieldState } from '@/lib/github-config-drift'

export function GitHubConfigCallout({
  state,
  className,
}: {
  state?: GitHubConfigFieldState
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const isVisible = state !== undefined && state.status !== 'unmanaged'

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="github-config-callout"
          className="overflow-hidden"
          layout
          initial={reduceMotion ? false : { height: 0, opacity: 0, y: -4 }}
          animate={{ height: 'auto', opacity: 1, y: 0 }}
          exit={reduceMotion ? { height: 0 } : { height: 0, opacity: 0, y: -4 }}
          transition={transition}
        >
          <GitHubConfigCalloutContent state={state} className={className} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GitHubConfigCalloutContent({
  state,
  className,
}: {
  state: Exclude<GitHubConfigFieldState, { status: 'unmanaged' }>
  className?: string
}) {
  const isDrifted = state.status === 'drifted'
  const githubValue = formatConfigValue(state.githubValue)

  return (
    <motion.div
      className={cn(
        'w-full rounded-lg border bg-surface-200 px-5 py-4',
        isDrifted ? 'border-warning-400 bg-warning/10' : 'border-default',
        className
      )}
      layout="position"
      title={isDrifted ? `GitHub value: ${githubValue}` : undefined}
    >
      <div className="flex items-center gap-3">
        {isDrifted ? (
          <AlertTriangle className="shrink-0 text-warning" size={16} />
        ) : (
          <IconGitHubSolid className="h-4 w-4 shrink-0 text-foreground-light" />
        )}
        <p className="min-w-0 text-sm text-foreground-light">
          <span className="font-medium text-foreground">
            {isDrifted ? 'Drift from config.toml' : 'Managed by config.toml'}
          </span>{' '}
          — current environment {isDrifted ? 'differs from' : 'matches'}{' '}
          <code className="text-code-inline">{state.configPath}</code>
          {isDrifted ? ' and is currently active.' : '.'}
        </p>
      </div>
    </motion.div>
  )
}
