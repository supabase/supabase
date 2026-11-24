import { Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  DatabaseBackupIcon,
  ExternalLinkIcon,
  FileCheckIcon,
  GitBranchIcon,
  HeartPulseIcon,
  KeyRoundIcon,
  LifeBuoyIcon,
  NetworkIcon,
  PackageOpenIcon,
  PowerIcon,
  ScrollTextIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from 'ui'

import { MicroComputeUpgradeCard } from './MicroComputeUpgradeCard'
import { FullScreenPanel } from './PlanUpdatePanelShell'
import { getLinkProjectRef, getNanoProjects, type UpgradedPlanId } from './PlanUpgradeSuccess.utils'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { DOCS_URL } from '@/lib/constants'

const TEAM_ONBOARDING_PACK_URL = 'https://hubs.ly/Q02H8qBC0'
const TEAM_BOOK_SUCCESS_ENGINEERING_URL = 'https://forms.supabase.com/teamtier'

const PLAN_NAMES: Record<UpgradedPlanId, string> = { pro: 'Pro', team: 'Team' }

const Benefit = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) => (
  <li className="flex items-start gap-3">
    <Icon size={16} className="mt-0.5 shrink-0 text-foreground-lighter" aria-hidden="true" />
    <div className="flex flex-col gap-0.5">
      <p className="text-sm text-foreground">{title}</p>
      {description && <p className="text-sm text-foreground-light">{description}</p>}
      {action && <div className="text-sm text-foreground-light">{action}</div>}
    </div>
  </li>
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
  <li className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-foreground-lighter" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-foreground">{title}</p>
        <p className="text-sm text-foreground-light">{description}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">{children}</div>
  </li>
)

const linkClassName = 'underline transition-colors hover:text-foreground'

const ExternalButton = ({ href, children }: { href: string; children: ReactNode }) => (
  <Button asChild variant="default" iconRight={<ExternalLinkIcon />}>
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  </Button>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex w-full flex-col gap-3">
    <h2 className="text-base text-foreground">{title}</h2>
    {children}
  </section>
)

interface PlanUpgradeSuccessViewProps {
  planId: UpgradedPlanId
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
  organizationName,
  organizationSlug,
  projects,
  isSpendCapEnabled,
  onManageSpendCap,
  onClose,
}: PlanUpgradeSuccessViewProps) => {
  const planName = PLAN_NAMES[planId]
  const nanoProjects = getNanoProjects(projects)
  const projectRef = getLinkProjectRef(projects)

  return (
    <FullScreenPanel onBack={onClose} contentClassName="max-w-3xl gap-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <span
          className="flex size-10 items-center justify-center rounded-full bg-brand-200 text-brand"
          aria-hidden="true"
        >
          <CheckIcon size={20} strokeWidth={2.5} />
        </span>
        <h1 className="text-2xl text-balance">Welcome to the {planName} plan</h1>
        <p className="text-balance text-foreground-light">
          <span className="text-foreground" translate="no">
            {organizationName ?? 'Your organization'}
          </span>{' '}
          is now on the {planName} plan. Here's what's included and what to set up next.
        </p>
      </header>

      {nanoProjects.length > 0 && (
        <MicroComputeUpgradeCard planId={planId} projects={nanoProjects} />
      )}

      {planId === 'pro' && (
        <Section title="Now included">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-5 rounded-md border bg-surface-100 p-5 sm:grid-cols-2">
            <Benefit
              icon={DatabaseBackupIcon}
              title="Daily backups"
              description="Stored for 7 days."
              action={
                <Link
                  to="/project/$ref/database/backups/scheduled"
                  params={{ ref: projectRef }}
                  className={linkClassName}
                >
                  View backups
                </Link>
              }
            />
            <Benefit
              icon={GitBranchIcon}
              title="Branching"
              description="Test changes in preview branches before they reach production."
              action={
                <Link
                  to="/project/$ref/branches"
                  params={{ ref: projectRef }}
                  className={linkClassName}
                >
                  Open branches
                </Link>
              }
            />
            <Benefit
              icon={PowerIcon}
              title="No project pausing"
              description="Projects stay online, even when idle."
            />
            <Benefit icon={ScrollTextIcon} title="7-day log retention" />
            <Benefit
              icon={NetworkIcon}
              title="Dedicated pooler"
              description="A connection pooler that runs alongside your database."
            />
            <Benefit icon={LifeBuoyIcon} title="Email support" />
          </ul>
        </Section>
      )}

      {planId === 'team' && (
        <Section title="Everything in Pro, plus">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-5 rounded-md border bg-surface-100 p-5 sm:grid-cols-2">
            <Benefit
              icon={DatabaseBackupIcon}
              title="Daily backups stored for 14 days"
              action={
                <Link
                  to="/project/$ref/database/backups/scheduled"
                  params={{ ref: projectRef }}
                  className={linkClassName}
                >
                  View backups
                </Link>
              }
            />
            <Benefit icon={ScrollTextIcon} title="28-day log retention" />
            <Benefit
              icon={UsersIcon}
              title="Read-only and project-scoped roles"
              action={
                <Link
                  to="/org/$slug/team"
                  params={{ slug: organizationSlug }}
                  className={linkClassName}
                >
                  Manage team
                </Link>
              }
            />
            <Benefit
              icon={KeyRoundIcon}
              title="SSO for the dashboard"
              action={
                <Link
                  to="/org/$slug/sso"
                  params={{ slug: organizationSlug }}
                  className={linkClassName}
                >
                  Set up SSO
                </Link>
              }
            />
            <Benefit
              icon={FileCheckIcon}
              title="SOC 2 report and security questionnaire"
              action={
                <Link
                  to="/org/$slug/documents"
                  params={{ slug: organizationSlug }}
                  className={linkClassName}
                >
                  View documents
                </Link>
              }
            />
            <Benefit
              icon={HeartPulseIcon}
              title="HIPAA"
              description="Available as a paid add-on."
            />
            <Benefit icon={LifeBuoyIcon} title="Priority email support and SLAs" />
          </ul>
        </Section>
      )}

      <Section title="Next steps">
        <ul className="divide-y rounded-md border bg-surface-100">
          {planId === 'pro' && (
            <NextStep
              icon={NetworkIcon}
              title="Connect through the dedicated pooler"
              description={
                <>
                  Lower latency than the shared pooler. Copy its connection string from Connect.{' '}
                  <a
                    href={`${DOCS_URL}/guides/database/connecting-to-postgres#dedicated-pooler`}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClassName}
                  >
                    Docs
                  </a>
                </>
              }
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

          {planId === 'pro' && isSpendCapEnabled && (
            <NextStep
              icon={WalletIcon}
              title="Turn off the spend cap to keep scaling"
              description={
                <>
                  With the spend cap on, usage beyond Pro plan limits is restricted instead of
                  billed.{' '}
                  <a
                    href={`${DOCS_URL}/guides/platform/cost-control#spend-cap`}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClassName}
                  >
                    How the spend cap works
                  </a>
                </>
              }
            >
              <Button variant="default" onClick={onManageSpendCap}>
                Manage spend cap
              </Button>
            </NextStep>
          )}

          {planId === 'team' && (
            <NextStep
              icon={PackageOpenIcon}
              title="Read the Team onboarding pack"
              description="What's different on Team, for you and your team."
            >
              <ExternalButton href={TEAM_ONBOARDING_PACK_URL}>Open onboarding pack</ExternalButton>
            </NextStep>
          )}

          {planId === 'team' && (
            <NextStep
              icon={CalendarIcon}
              title="Book time with Success Engineering"
              description="Get help planning your setup, migrations, or scaling."
            >
              <ExternalButton href={TEAM_BOOK_SUCCESS_ENGINEERING_URL}>Book a call</ExternalButton>
            </NextStep>
          )}
        </ul>
      </Section>

      <Button variant="primary" size="medium" onClick={onClose}>
        Back to billing
      </Button>
    </FullScreenPanel>
  )
}
