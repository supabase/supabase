import { Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronRightIcon,
  CheckIcon,
  DatabaseBackupIcon,
  FileCheckIcon,
  GaugeIcon,
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
import type { ReactNode } from 'react'
import { Button } from 'ui'

import { MicroComputeUpgradeCard } from './MicroComputeUpgradeCard'
import { FullScreenPanel } from './PlanUpdatePanelShell'
import { getLinkProjectRef, type UpgradedPlanId } from './PlanUpgradeSuccess.utils'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { DOCS_URL } from '@/lib/constants'

const TEAM_BOOK_SUCCESS_ENGINEERING_URL = 'https://forms.supabase.com/teamtier'

const PLAN_NAMES: Record<UpgradedPlanId, string> = { pro: 'Pro', team: 'Team' }

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

const NextStep = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: ReactNode
  /** Actions for this step. */
  children: ReactNode
}) => (
  <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-foreground-lighter" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="text-base text-foreground">{title}</p>
        <p className="text-sm text-foreground-light">{description}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">{children}</div>
  </li>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex w-full flex-col gap-3">
    <h2 className="text-base text-foreground-light">{title}</h2>
    {children}
  </section>
)

interface PlanUpgradeSuccessViewProps {
  planId: UpgradedPlanId
  /** The plan the organization was on before upgrading. Unknown when the screen is opened by URL. */
  previousPlanId?: string
  organizationName: string | undefined
  organizationSlug: string
  projects: OrgProject[]
  /** The org caps usage at its plan limits instead of billing for it. Pro plan only. */
  isSpendCapEnabled: boolean
  onManageSpendCap: () => void
  onClose: () => void
}

/**
 * Shown after an upgrade to Pro or Team: what the plan includes now, and what to set up next.
 * Mirrors the welcome email for each plan, plus a push to move Nano projects to Micro.
 */
export const PlanUpgradeSuccessView = ({
  planId,
  previousPlanId = planId === 'pro' ? 'free' : 'pro',
  organizationName,
  organizationSlug,
  projects,
  isSpendCapEnabled,
  onManageSpendCap,
  onClose,
}: PlanUpgradeSuccessViewProps) => {
  const planName = PLAN_NAMES[planId]
  // Skipping Pro means none of its features have been unlocked yet, so Team lists them too.
  const isTeamFromFree = planId === 'team' && previousPlanId === 'free'
  // Pro's setup steps apply to anyone coming from Free, whichever paid plan they picked.
  const isFromFree = previousPlanId === 'free'
  const projectRef = getLinkProjectRef(projects)

  const backupsAction = (
    <Link
      to="/project/$ref/database/backups/scheduled"
      params={{ ref: projectRef }}
      className={benefitLinkClassName}
    >
      <BenefitLabel>View</BenefitLabel>
    </Link>
  )

  const branchingBenefit = (
    <Benefit
      icon={GitBranchIcon}
      title="Branching"
      action={
        <Link
          to="/project/$ref/branches"
          params={{ ref: projectRef }}
          className={benefitLinkClassName}
        >
          <BenefitLabel>Open</BenefitLabel>
        </Link>
      }
    />
  )
  const noPausingBenefit = <Benefit icon={PowerIcon} title="No project pausing" />
  const poolerBenefit = (
    <Benefit
      icon={NetworkIcon}
      title="Dedicated pooler"
      action={
        <Link
          to="/project/$ref"
          params={{ ref: projectRef }}
          search={{ showConnect: true }}
          className={benefitLinkClassName}
        >
          <BenefitLabel>Connect</BenefitLabel>
        </Link>
      }
    />
  )

  return (
    <FullScreenPanel onBack={onClose} contentClassName="max-w-3xl items-stretch gap-10 text-left">
      <header className="flex flex-col items-start gap-2">
        <p className="flex items-center gap-2 text-sm text-brand">
          <span
            className="flex size-6 items-center justify-center rounded-full bg-brand-200"
            aria-hidden="true"
          >
            <CheckIcon size={14} strokeWidth={2.5} />
          </span>
          <span>Successfully upgraded</span>
        </p>
        <h1 className="text-3xl text-foreground">You're on {planName}</h1>
        <p className="text-lg text-foreground-light">
          <span className="text-foreground" translate="no">
            {organizationName ?? 'Your organization'}
          </span>{' '}
          has access to everything below, starting now.
        </p>
      </header>

      <MicroComputeUpgradeCard
        planId={planId}
        organizationSlug={organizationSlug}
        projects={projects}
      />

      {planId === 'pro' && (
        <Section title="Now included">
          <BenefitGrid count={6}>
            <Benefit
              icon={DatabaseBackupIcon}
              title="Daily backups"
              detail="7 days"
              action={backupsAction}
            />
            {branchingBenefit}
            {noPausingBenefit}
            {poolerBenefit}
            <Benefit icon={ScrollTextIcon} title="Log retention" detail="7 days" />
            <Benefit icon={LifeBuoyIcon} title="Email support" />
          </BenefitGrid>
        </Section>
      )}

      {planId === 'team' && (
        <Section title={isTeamFromFree ? 'Now included' : 'Everything in Pro, plus'}>
          <BenefitGrid count={isTeamFromFree ? 10 : 7}>
            {isTeamFromFree && branchingBenefit}
            {isTeamFromFree && noPausingBenefit}
            {isTeamFromFree && poolerBenefit}
            <Benefit
              icon={DatabaseBackupIcon}
              title="Daily backups"
              detail="14 days"
              action={backupsAction}
            />
            <Benefit icon={ScrollTextIcon} title="Log retention" detail="28 days" />
            <Benefit
              icon={UsersIcon}
              title="Read-only & scoped roles"
              action={
                <Link
                  to="/org/$slug/team"
                  params={{ slug: organizationSlug }}
                  className={benefitLinkClassName}
                >
                  <BenefitLabel>Team</BenefitLabel>
                </Link>
              }
            />
            <Benefit
              icon={KeyRoundIcon}
              title="Dashboard SSO"
              action={
                <Link
                  to="/org/$slug/sso"
                  params={{ slug: organizationSlug }}
                  className={benefitLinkClassName}
                >
                  <BenefitLabel>Set up</BenefitLabel>
                </Link>
              }
            />
            <Benefit
              icon={FileCheckIcon}
              title="SOC 2 report"
              action={
                <Link
                  to="/org/$slug/documents"
                  params={{ slug: organizationSlug }}
                  className={benefitLinkClassName}
                >
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
        </Section>
      )}

      <Section title="Recommended next">
        <ul className="divide-y rounded-md border bg-surface-100">
          {isFromFree && (
            <NextStep
              icon={NetworkIcon}
              title="Switch to the dedicated pooler"
              description="Lower latency than the shared pooler."
            >
              <Button asChild variant="default" iconRight={<ArrowRightIcon />}>
                <Link
                  to="/project/$ref"
                  params={{ ref: projectRef }}
                  search={{ showConnect: true }}
                >
                  Open Connect
                </Link>
              </Button>
            </NextStep>
          )}

          {isFromFree && isSpendCapEnabled && (
            <NextStep
              icon={GaugeIcon}
              title="Review your spend cap"
              description="On by default. Turn off to scale past included usage."
            >
              <Button variant="default" iconRight={<ArrowRightIcon />} onClick={onManageSpendCap}>
                Cost control
              </Button>
            </NextStep>
          )}

          {planId === 'team' && (
            <NextStep
              icon={KeyRoundIcon}
              title="Set up SSO"
              description="Require your identity provider for dashboard access."
            >
              <Button asChild variant="default" iconRight={<ArrowRightIcon />}>
                <Link to="/org/$slug/sso" params={{ slug: organizationSlug }}>
                  Configure
                </Link>
              </Button>
            </NextStep>
          )}

          {planId === 'team' && (
            <NextStep
              icon={CalendarIcon}
              title="Meet Success Engineering"
              description="Plan migrations, scaling, or your Team rollout."
            >
              <Button asChild variant="default" iconRight={<ArrowUpRightIcon />}>
                <a href={TEAM_BOOK_SUCCESS_ENGINEERING_URL} target="_blank" rel="noreferrer">
                  Book a call
                </a>
              </Button>
            </NextStep>
          )}
        </ul>
      </Section>

      <div>
        <Button variant="primary" size="medium" onClick={onClose}>
          Back to your organization
        </Button>
      </div>
    </FullScreenPanel>
  )
}
