import { ClockIcon, RefreshCwIcon, TrendingUpIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { DOCS_URL } from '@/lib/constants'

const Note = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="mt-1 shrink-0 text-foreground-lighter" aria-hidden="true">
      {icon}
    </span>
    <p className="text-base text-foreground-light">{children}</p>
  </li>
)

interface PlanChangeNotesProps {
  /** Any project the customer could move to Micro, used to link Infrastructure settings. */
  exampleProjectRef?: string
}

/**
 * What surprises customers after upgrading off Free: projects never pause, every project
 * in the org is billed, compute size does not change on its own, and the plan renews
 * until they cancel it. Only rendered for an upgrade from the Free plan.
 */
export const PlanChangeNotes = ({ exampleProjectRef }: PlanChangeNotesProps) => (
  <ul className="space-y-3">
    <Note icon={<ClockIcon size={16} />}>
      <span className="text-foreground">Projects never pause on Pro.</span> Each one is a dedicated
      server that runs and bills around the clock, even when idle.{' '}
      <a
        href={`${DOCS_URL}/guides/platform/project-transfer`}
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        Transfer
      </a>{' '}
      to Free or delete a project to stop its charges.
    </Note>

    <Note icon={<TrendingUpIcon size={16} />}>
      <span className="text-foreground">Upgrade your compute resources later.</span> Upgrade to
      Micro Compute in{' '}
      {exampleProjectRef ? (
        <a
          href={getInfrastructurePath(exampleProjectRef)}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Infrastructure settings
        </a>
      ) : (
        <span>Infrastructure settings</span>
      )}{' '}
      <span>when a short restart suits you. The price stays the same.</span>
    </Note>

    <Note icon={<RefreshCwIcon size={16} />}>
      <span className="text-foreground">Renews monthly</span> until you cancel.
    </Note>
  </ul>
)
