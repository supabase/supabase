import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, cn, HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'

import { BroomSparklesIcon } from '../BroomSparklesIcon'
import type { ExpirationMode } from '../StorageVersioning.constants'

/** Shared chip styling so the tokens and the operator badge read as one family. */
const POLICY_CHIP_CLASSNAME = 'rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px]'

const PolicyChip = ({ children }: { children: ReactNode }) => (
  <span className={cn(POLICY_CHIP_CLASSNAME, 'border-strong bg-surface-300 text-foreground-light')}>
    {children}
  </span>
)

const PolicyOperatorChip = ({ mode }: { mode: ExpirationMode }) => (
  <span
    className={cn(
      POLICY_CHIP_CLASSNAME,
      'border-strong border-dashed uppercase tracking-wide text-foreground-lighter',
      mode === 'and' && 'bg-surface-300'
    )}
  >
    {mode === 'and' ? 'Both' : 'Either'}
  </span>
)

interface PolicyRuleProps {
  cap: number | null
  expiryDays: number | null
  mode: ExpirationMode
}

/** The policy spelled out in plain language, for the hover card. */
const PolicyFullRule = ({ cap, expiryDays, mode }: PolicyRuleProps) => {
  // A cap always arrives with an age, so there are only three shapes to describe:
  // age alone, or age combined with the cap under either operator.
  const hasCap = cap !== null && cap > 0

  if (!hasCap) {
    return <>A noncurrent version is permanently deleted once it is older than {expiryDays} days.</>
  }

  if (mode === 'and') {
    return (
      <>
        A noncurrent version is permanently deleted only once it is <em>both</em> older than{' '}
        {expiryDays} days and beyond the {cap} newest noncurrent versions.
      </>
    )
  }

  return (
    <>
      A noncurrent version is permanently deleted as soon as it is <em>either</em> older than{' '}
      {expiryDays} days <em>or</em> beyond the {cap} newest noncurrent versions.
    </>
  )
}

interface VersionHistoryPolicyRowProps extends PolicyRuleProps {
  /** Opens the bucket settings, where the policy is configured. */
  onEditBucket: () => void
}

/**
 * The bucket's lifecycle policy as one inline row. A hover card rather than a
 * tooltip because the content holds a button — tooltip content is not reachable
 * by pointer or keyboard.
 */
export const VersionHistoryPolicyRow = ({
  cap,
  expiryDays,
  mode,
  onEditBucket,
}: VersionHistoryPolicyRowProps) => {
  const hasCap = cap !== null && cap > 0
  const hasExpiryDays = expiryDays !== null && expiryDays > 0
  const hasBoth = hasCap && hasExpiryDays

  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          tabIndex={0}
          onClick={onEditBucket}
          className="flex items-center gap-x-2 text-left"
          aria-label="Lifecycle policy details"
        >
          <BroomSparklesIcon size={16} className="mr-1 shrink-0 text-foreground-lighter" />
          <span className="flex items-center gap-x-1">
            {hasExpiryDays && <PolicyChip>{expiryDays}d</PolicyChip>}
            {hasBoth && <PolicyOperatorChip mode={mode} />}
            {hasCap && <PolicyChip>{cap} noncurrent v. retained</PolicyChip>}
          </span>
          {hasExpiryDays && !hasCap && (
            <span className="font-mono text-[11px] text-foreground-lighter">
              — no retention cap
            </span>
          )}
          <Info size={13} className="text-foreground-lighter" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-72 space-y-1.5 text-xs">
        <div className="flex items-center gap-x-1">
          <BroomSparklesIcon size={16} className="mr-1 shrink-0" />
          <p className="font-medium text-foreground">Lifecycle policy</p>
        </div>
        <p className="text-foreground-light">
          <PolicyFullRule cap={cap} expiryDays={expiryDays} mode={mode} />
        </p>
        <Button variant="default" onClick={onEditBucket}>
          View bucket settings
        </Button>
      </HoverCardContent>
    </HoverCard>
  )
}
