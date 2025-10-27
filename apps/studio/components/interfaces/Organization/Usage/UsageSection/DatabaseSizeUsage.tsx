import Link from 'next/link'
import { useMemo } from 'react'

import Panel from 'components/ui/Panel'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import { OrgUsageResponse } from 'data/usage/org-usage-query'
import { formatBytes } from 'lib/helpers'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  CriticalIcon,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { SectionContent } from '../SectionContent'
import { CategoryAttribute } from '../Usage.constants'

export interface DatabaseSizeUsageProps {
  slug: string
  projectRef?: string
  attribute: CategoryAttribute
  subscription?: OrgSubscription
  usage?: OrgUsageResponse

  currentBillingCycleSelected: boolean
}

const DatabaseSizeUsage = ({
  attribute,
  subscription,
  usage,
  currentBillingCycleSelected,
}: DatabaseSizeUsageProps) => {
  const databaseSizeUsage = useMemo(
    () => usage?.usages.find((it) => it.metric === PricingMetric.DATABASE_SIZE),
    [usage]
  )

  const hasProjectsExceedingDatabaseSize = useMemo(() => {
    return databaseSizeUsage?.project_allocations.some((it) => it.usage > 0.5 * 1e9)
  }, [databaseSizeUsage])

  return (
    <div id={attribute.anchor} className="scroll-my-12">
      <SectionContent section={attribute}>
        <div className="space-y-4">
          {currentBillingCycleSelected && hasProjectsExceedingDatabaseSize && (
            <Alert_Shadcn_ variant="warning">
              <CriticalIcon />
              <AlertTitle_Shadcn_>Projects exceeding quota</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                You have projects that are exceeding 0.5 GB of database size. Reduce the database
                size or upgrade to a paid plan.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-sm">{attribute.name} usage</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b py-1">
              <p className="text-xs text-foreground-light">
                Included in {subscription?.plan?.name} Plan
              </p>
              <p className="text-xs">0.5 GB per project</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-foreground-light">Max database size</p>
              <p className="text-xs">
                {databaseSizeUsage?.usage ? formatBytes(databaseSizeUsage?.usage_original) : '-'}
              </p>
            </div>
          </div>

          {currentBillingCycleSelected ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm">Current database size per project</p>
              </div>

              {databaseSizeUsage?.project_allocations.length === 0 && (
                <Panel>
                  <Panel.Content>
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm">No active projects</p>
                      <p className="text-sm text-foreground-light">
                        You don't have any active projects in this organization.
                      </p>
                    </div>
                  </Panel.Content>
                </Panel>
              )}

              {databaseSizeUsage?.project_allocations.map((project, idx) => {
                return (
                  <div
                    key={`usage-project-${project.ref}`}
                    className={
                      idx !== databaseSizeUsage.project_allocations.length - 1
                        ? 'border-b pb-2'
                        : ''
                    }
                  >
                    <div className="flex justify-between">
                      <span className="text-foreground-light flex items-center gap-2">
                        {project.name}
                      </span>
                      <Button asChild type="default" size={'tiny'}>
                        <Link
                          href={`/project/${project.ref}/reports/database#database-size-report`}
                        >
                          Manage Database Size
                        </Link>
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center h-6 gap-3">
                        <span className="text-foreground-light text-sm font-mono flex items-center gap-2">
                          <span className="text-foreground font-semibold font-mono -mt-[2px]">
                            {formatBytes(project.usage)}
                          </span>{' '}
                          Database Size
                        </span>
                        <InfoTooltip side="top">
                          <p>
                            {formatBytes(project.usage)} GB database size as reported by Postgres.
                          </p>
                        </InfoTooltip>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Panel>
              <Panel.Content>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm">Data not available</p>
                  <p className="text-sm text-foreground-light">
                    Switch to current billing cycle to see current database size per project.
                  </p>
                </div>
              </Panel.Content>
            </Panel>
          )}
        </div>
      </SectionContent>
    </div>
  )
}

export default DatabaseSizeUsage
