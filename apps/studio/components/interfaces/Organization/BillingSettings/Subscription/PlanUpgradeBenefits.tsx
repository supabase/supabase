import { Link } from '@tanstack/react-router'
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  DatabaseBackupIcon,
  FileCheckIcon,
  GitBranchIcon,
  HeartPulseIcon,
  KeyRoundIcon,
  LifeBuoyIcon,
  NetworkIcon,
  PowerIcon,
  ScrollTextIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { type ReactNode } from 'react'

import { DOCS_URL } from '@/lib/constants'

const benefitLinkClassName =
  'flex shrink-0 items-center gap-1 text-sm text-foreground-light transition-colors hover:text-foreground'

const BenefitLabel = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <ChevronRightIcon size={14} aria-hidden="true" />
  </>
)

/** Two column grid with hairline dividers; an odd item count is padded so the last row stays boxed. */
const BenefitGrid = ({ children, count }: { children: ReactNode; count: number }) => (
  <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
    {children}
    {count % 2 === 1 && <li aria-hidden="true" className="hidden bg-surface-100 sm:block" />}
  </ul>
)

interface BenefitProps {
  icon: LucideIcon
  title: string
  /** Muted text shown beside the title, e.g. a retention period. */
  detail?: string
  /** A `BenefitLink` shown at the end of the row. */
  action?: ReactNode
}

const Benefit = ({ icon: Icon, title, detail, action }: BenefitProps) => (
  <li className="flex items-center gap-3 bg-surface-100 px-4 py-4">
    <Icon size={18} className="shrink-0 text-foreground-lighter" aria-hidden="true" />
    <p className="flex-1 text-sm text-foreground">
      <span>{title}</span>
      {detail && <span className="ml-2 text-foreground-lighter">{detail}</span>}
    </p>
    {action}
  </li>
)

const BackupsBenefit = ({ ref, days = 7 }: { ref: string; days?: number }) => {
  return (
    <Benefit
      icon={DatabaseBackupIcon}
      title="Daily backups"
      detail={`${days} days`}
      action={
        <Link
          to="/project/$ref/database/backups/scheduled"
          params={{ ref }}
          className={benefitLinkClassName}
        >
          <BenefitLabel>View</BenefitLabel>
        </Link>
      }
    />
  )
}

const BranchingBenefit = ({ ref }: { ref: string }) => {
  return (
    <Benefit
      icon={GitBranchIcon}
      title="Branching"
      action={
        <Link to="/project/$ref/branches" params={{ ref }} className={benefitLinkClassName}>
          <BenefitLabel>Open</BenefitLabel>
        </Link>
      }
    />
  )
}

const NoPausingBenefit = () => <Benefit icon={PowerIcon} title="No project pausing" />

const PoolerBenefit = ({ ref }: { ref: string }) => (
  <Benefit
    icon={NetworkIcon}
    title="Dedicated pooler"
    action={
      <Link
        to="/project/$ref"
        params={{ ref }}
        search={{ showConnect: true }}
        className={benefitLinkClassName}
      >
        <BenefitLabel>Connect</BenefitLabel>
      </Link>
    }
  />
)

export const ProPlanBenefits = ({ ref }: { ref: string }) => {
  return (
    <BenefitGrid count={6}>
      <BackupsBenefit ref={ref} />
      <BranchingBenefit ref={ref} />
      <NoPausingBenefit />
      <PoolerBenefit ref={ref} />
      <Benefit icon={ScrollTextIcon} title="Log retention" detail="7 days" />
      <Benefit icon={LifeBuoyIcon} title="Email support" />
    </BenefitGrid>
  )
}

export const TeamPlanBenefits = ({
  ref,
  slug,
  isTeamFromFree,
}: {
  ref: string
  slug: string
  isTeamFromFree: boolean
}) => {
  return (
    <BenefitGrid count={isTeamFromFree ? 10 : 7}>
      {isTeamFromFree && <BranchingBenefit ref={ref} />}
      {isTeamFromFree && <NoPausingBenefit />}
      {isTeamFromFree && <PoolerBenefit ref={ref} />}
      <BackupsBenefit ref={ref} days={14} />
      <Benefit icon={ScrollTextIcon} title="Log retention" detail="28 days" />
      <Benefit
        icon={UsersIcon}
        title="Read-only & scoped roles"
        action={
          <Link to="/org/$slug/team" params={{ slug }} className={benefitLinkClassName}>
            <BenefitLabel>Team</BenefitLabel>
          </Link>
        }
      />
      <Benefit
        icon={KeyRoundIcon}
        title="Dashboard SSO"
        action={
          <Link to="/org/$slug/sso" params={{ slug }} className={benefitLinkClassName}>
            <BenefitLabel>Set up</BenefitLabel>
          </Link>
        }
      />
      <Benefit
        icon={FileCheckIcon}
        title="SOC 2 report"
        action={
          <Link to="/org/$slug/documents" params={{ slug }} className={benefitLinkClassName}>
            <BenefitLabel>Docs</BenefitLabel>
          </Link>
        }
      />
      <Benefit
        icon={HeartPulseIcon}
        title="HIPAA"
        detail="paid add-on"
        action={
          <a
            href={`${DOCS_URL}/guides/security/hipaa-compliance`}
            target="_blank"
            rel="noreferrer"
            className={benefitLinkClassName}
          >
            Docs
            <ArrowUpRightIcon size={14} aria-hidden="true" />
          </a>
        }
      />
      <Benefit icon={LifeBuoyIcon} title="Priority support & SLAs" />
    </BenefitGrid>
  )
}
