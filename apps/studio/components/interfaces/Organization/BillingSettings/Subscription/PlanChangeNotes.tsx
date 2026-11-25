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
  onProjectTransferDocsClick: () => void
}

/**
 * What surprises customers after upgrading off Free: projects never pause, every project
 * in the org is billed, compute size does not change on its own, and the plan renews
 * until they cancel it. Only rendered for an upgrade from the Free plan.
 */
export const PlanChangeNotes = ({
  exampleProjectRef,
  onProjectTransferDocsClick,
}: PlanChangeNotesProps) => (
  <ul className="space-y-3">
    <Note icon={<ClockIcon size={16} />}>
      <span className="text-foreground">Projects never pause.</span> Every project bills around the
      clock, even when idle.{' '}
      <a
        href={`${DOCS_URL}/guides/platform/project-transfer`}
        target="_blank"
        rel="noreferrer"
        className="underline"
        onClick={onProjectTransferDocsClick}
      >
        Transfer
      </a>{' '}
      or delete one to stop its charges.
    </Note>

    <Note icon={<TrendingUpIcon size={16} />}>
      <span className="text-foreground">Compute stays as it is.</span> Upgrade to Micro in{' '}
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
      <span>at the same price, after a short restart.</span>
    </Note>

    <Note icon={<RefreshCwIcon size={16} />}>
      <span className="text-foreground">Renews monthly</span> until you cancel.
    </Note>
  </ul>
)
