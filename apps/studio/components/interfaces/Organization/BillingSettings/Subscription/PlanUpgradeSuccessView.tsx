import { Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  GaugeIcon,
  KeyRoundIcon,
  NetworkIcon,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from 'ui'

import { MicroComputeUpgradeCard } from './MicroComputeUpgradeCard'
import { FullScreenPanel } from './PlanUpdatePanelShell'
import { ProPlanBenefits, TeamPlanBenefits } from './PlanUpgradeBenefits'
import { getLinkProjectRef, type UpgradedPlanId } from './PlanUpgradeSuccess.utils'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'

const TEAM_BOOK_SUCCESS_ENGINEERING_URL = 'https://forms.supabase.com/teamtier'

const PLAN_NAMES: Record<UpgradedPlanId, string> = { pro: 'Pro', team: 'Team' }

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
        <p className="text-sm text-foreground">{title}</p>
        <p className="text-sm text-foreground-lighter">{description}</p>
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
        <Section title="Now available">
          <ProPlanBenefits ref={projectRef} />
        </Section>
      )}

      {planId === 'team' && (
        <Section title={isTeamFromFree ? 'Now available' : 'Everything in Pro, plus'}>
          <TeamPlanBenefits
            ref={projectRef}
            slug={organizationSlug}
            isTeamFromFree={isTeamFromFree}
          />
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
              description="If you have any questions or need assistance, please reach out."
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
