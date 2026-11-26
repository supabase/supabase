import { useParams } from 'common'
import { ExternalLinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  getMonthlyComputePrice,
  getResumeComputeCost,
  MONTHLY_COMPUTE_CREDIT,
} from './ResumeProjectCost.utils'
import {
  getAvailableComputeOptions,
  mapComputeSizeNameToAddonVariantId,
} from '@/components/interfaces/DiskManagement/DiskManagement.utils'
import { formatRoundedCurrency } from '@/components/interfaces/Organization/BillingSettings/Subscription/PlanChangeSummary.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL, PROJECT_STATUS } from '@/lib/constants'

// The projects endpoint's status filter only accepts ACTIVE_HEALTHY and INACTIVE, so this is
// applied client-side against the unfiltered project list instead.
const ACTIVE_PROJECT_STATUSES: string[] = [
  PROJECT_STATUS.ACTIVE_HEALTHY,
  PROJECT_STATUS.COMING_UP,
  PROJECT_STATUS.RESTORING,
]

const COMPUTE_DOCS_URL = `${DOCS_URL}/guides/platform/manage-your-usage/compute`
const COMPUTE_CREDITS_DOCS_URL = `${COMPUTE_DOCS_URL}#compute-credits`

const CostRow = ({
  label,
  children,
  isTotal = false,
}: {
  label: ReactNode
  children: ReactNode
  isTotal?: boolean
}) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className={isTotal ? 'text-foreground' : 'text-foreground-light'}>{label}</span>
    <div className="flex shrink-0 items-center gap-2 text-foreground" translate="no">
      {children}
    </div>
  </div>
)

const HOURLY_BILLING_NOTE =
  'Compute is billed hourly, so you only pay for the hours the project is active.'

const CostInfoTooltip = ({
  children,
  note,
  docsHref,
  docsLabel,
  className = 'underline decoration-dotted underline-offset-4',
}: {
  children: ReactNode
  note: ReactNode
  docsHref: string
  docsLabel: string
  className?: string
}) => (
  <Tooltip>
    <TooltipTrigger className={className}>{children}</TooltipTrigger>
    <TooltipContent side="bottom" className="flex w-72 flex-col gap-y-2 p-3">
      <p className="text-foreground-light">{note}</p>
      <InlineLink href={docsHref} className="flex items-center gap-x-1">
        {docsLabel}
        <ExternalLinkIcon size={12} strokeWidth={1.5} />
      </InlineLink>
    </TooltipContent>
  </Tooltip>
)

const getCreditStatus = ({
  isCovered,
  hasActiveProjects,
}: {
  isCovered: boolean
  hasActiveProjects: boolean
}) => {
  if (isCovered) return 'cover this project, so resuming it adds no compute cost.'
  if (hasActiveProjects) return 'are already used by another active project.'
  return 'are applied to this project.'
}

const CreditNote = ({
  isCovered,
  hasActiveProjects,
}: {
  isCovered: boolean
  hasActiveProjects: boolean
}) => (
  <>
    Your plan’s <span translate="no">{formatRoundedCurrency(MONTHLY_COMPUTE_CREDIT)}</span> compute
    credits {getCreditStatus({ isCovered, hasActiveProjects })} {HOURLY_BILLING_NOTE}
  </>
)

export const ResumeProjectCost = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  // TODO(kevin): need new backend endpoints covering active compute pricing to show this
  // confidently for platform plan nano projects — they aren't priced through this addons endpoint.
  const canShowComputeCost = !(
    organization?.plan?.id === 'platform' && project?.infra_compute_size === 'nano'
  )

  const {
    data: addons,
    isLoading: isAddonsLoading,
    isError: isAddonsError,
  } = useProjectAddonsQuery({ projectRef: ref }, { enabled: canShowComputeCost })

  const {
    data: orgProjects,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useOrgProjectsInfiniteQuery(
    { slug: organization?.slug },
    { enabled: canShowComputeCost && organization?.slug !== undefined }
  )

  const computeOptions = getAvailableComputeOptions(
    addons?.available_addons ?? [],
    project?.cloud_provider
  )
  const currentVariantId = project?.infra_compute_size
    ? mapComputeSizeNameToAddonVariantId(project.infra_compute_size)
    : undefined
  // Nano on a paid plan is billed at the Micro rate
  const billedVariantId = currentVariantId === 'ci_nano' ? 'ci_micro' : currentVariantId
  const computeVariant = computeOptions.find((option) => option.identifier === billedVariantId)

  if (canShowComputeCost && (isAddonsLoading || isProjectsLoading)) {
    return <ShimmeringLoader className="h-12 w-full" />
  }

  // Without both a price and the project list, fall back rather than risk the wrong figure.
  if (
    !canShowComputeCost ||
    isAddonsError ||
    isProjectsError ||
    computeVariant === undefined ||
    orgProjects === undefined
  ) {
    return (
      <p className="text-sm">
        Your project’s data will be restored and billing will resume based on compute size and hours
        active.
      </p>
    )
  }

  const hasActiveProjects = orgProjects.pages
    .flatMap((page) => page.projects)
    .some(
      (orgProject) => orgProject.ref !== ref && ACTIVE_PROJECT_STATUSES.includes(orgProject.status)
    )
  const { monthlyPrice, credit, monthlyTotal, isCovered } = getResumeComputeCost({
    monthlyPrice: getMonthlyComputePrice(computeVariant),
    hasActiveProjects,
  })

  const creditNote = <CreditNote isCovered={isCovered} hasActiveProjects={hasActiveProjects} />
  const showCreditBreakdown = !isCovered && credit > 0
  const computeLabel = `${computeVariant.name} compute`

  return (
    <div className="flex flex-col gap-y-3">
      <p className="text-sm">
        Your project’s data will be restored and compute billing resumes once it is active. You can
        change your compute size later.
      </p>

      <div className="flex flex-col gap-y-2 rounded-md border bg-surface-100 px-4 py-3">
        <CostRow
          label={
            !isCovered && !showCreditBreakdown ? (
              <CostInfoTooltip
                note={HOURLY_BILLING_NOTE}
                docsHref={COMPUTE_DOCS_URL}
                docsLabel="About compute pricing"
              >
                {computeLabel}
              </CostInfoTooltip>
            ) : (
              computeLabel
            )
          }
        >
          {isCovered && (
            <>
              <span className="text-foreground-lighter line-through">
                {formatRoundedCurrency(monthlyPrice)}
              </span>
              <CostInfoTooltip
                note={creditNote}
                docsHref={COMPUTE_CREDITS_DOCS_URL}
                docsLabel="About compute credits"
                className="cursor-help"
              >
                <Badge variant="success">Covered</Badge>
              </CostInfoTooltip>
            </>
          )}
          {!isCovered && showCreditBreakdown && <span>{formatRoundedCurrency(monthlyPrice)}</span>}
          {!isCovered && !showCreditBreakdown && (
            <span>
              {formatRoundedCurrency(monthlyPrice)}
              <span className="text-foreground-light">/month</span>
            </span>
          )}
        </CostRow>

        {showCreditBreakdown && (
          <>
            <CostRow
              label={
                <CostInfoTooltip
                  note={creditNote}
                  docsHref={COMPUTE_CREDITS_DOCS_URL}
                  docsLabel="About compute credits"
                >
                  Compute credits
                </CostInfoTooltip>
              }
            >
              <span>-{formatRoundedCurrency(credit)}</span>
            </CostRow>
            <div className="border-t" />
            <CostRow label="Estimated monthly cost" isTotal>
              <span className="font-medium">{formatRoundedCurrency(monthlyTotal)}</span>
            </CostRow>
          </>
        )}
      </div>
    </div>
  )
}
