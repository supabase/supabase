import { ArrowLeftRightIcon, ClockIcon, RefreshCwIcon, TrendingUpIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { DOCS_URL } from '@/lib/constants'

const Note = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="mt-0.5 shrink-0 text-foreground-lighter" aria-hidden="true">
      {icon}
    </span>
    <p className="text-sm text-foreground-light">{children}</p>
  </li>
)

interface PlanChangeNotesProps {
  /** Any project the customer could move to Micro, used to link Infrastructure settings. */
  exampleProjectRef?: string
  /** Drives whether transferring projects out is worth suggesting. */
  hasProjectsToLeaveBehind: boolean
}

/**
 * What surprises customers after upgrading off Free: projects never pause, every project
 * in the org is billed, compute size does not change on its own, and the plan renews
 * until they cancel it. Only rendered for an upgrade from the Free plan.
 */
export const PlanChangeNotes = ({
  exampleProjectRef,
  hasProjectsToLeaveBehind,
}: PlanChangeNotesProps) => (
  <ul className="space-y-3">
    <Note icon={<ClockIcon size={14} />}>
      <span className="text-foreground">Projects never pause on Pro.</span> Each one is a dedicated
      server that runs and bills around the clock, even when idle. Transfer to Free or delete a
      project to stop its charges.
    </Note>

    {hasProjectsToLeaveBehind ? (
      <Note icon={<ArrowLeftRightIcon size={14} />}>
        <span className="text-foreground">Only want to pay for some projects?</span>{' '}
        <a
          href={`${DOCS_URL}/guides/platform/project-transfer`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Transfer projects
        </a>{' '}
        you want to keep on Free to a separate organization before upgrading. No downtime.
      </Note>
    ) : (
      <Note icon={<ArrowLeftRightIcon size={14} />}>
        <span className="text-foreground">Want a hobby project to stay free later?</span> Keep it in
        a separate Free org. You can{' '}
        <a
          href={`${DOCS_URL}/guides/platform/project-transfer`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          transfer projects
        </a>{' '}
        between orgs anytime.
      </Note>
    )}

    <Note icon={<TrendingUpIcon size={14} />}>
      <span className="text-foreground">
        Your projects keep their current compute resources until you switch them.
      </span>{' '}
      Upgrade to Micro Compute in{' '}
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

    <Note icon={<RefreshCwIcon size={14} />}>
      <span className="text-foreground">
        Your subscription will automatically renew every month until explicitly canceled.
      </span>
    </Note>
  </ul>
)
