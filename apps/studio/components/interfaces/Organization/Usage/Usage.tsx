import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Check, ChevronDown } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Button, cn, CommandGroup, CommandItem } from 'ui'

import Activity from './Activity'
import Compute from './Compute'
import Egress from './Egress'
import SizeAndCounts from './SizeAndCounts'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldTitle,
} from '@/components/layouts/Scaffold'
import AlertError from '@/components/ui/AlertError'
import DateRangePicker from '@/components/ui/DateRangePicker'
import NoPermission from '@/components/ui/NoPermission'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { useOrgDailyStatsQuery } from '@/data/analytics/org-daily-stats-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { TIME_PERIODS_REPORTS } from '@/lib/constants/metrics'

// [console fork] Self-host usage view: shows usage metrics only, no billing.
// A neutral, non-billed subscription stub keeps the metric sections rendering
// without any plan/billing chrome.
const SELF_HOST_SUBSCRIPTION = {
  plan: { id: 'enterprise', name: 'Enterprise' },
  usage_billing_enabled: false,
} as any

export const Usage = () => {
  const { slug } = useParams()

  const [dateRange, setDateRange] = useState<any>()
  const [selectedProjectRef, setSelectedProjectRef] = useQueryState('projectRef')
  const [openProjectSelector, setOpenProjectSelector] = useState(false)

  const { can: canReadUsage, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'organizations'
  )

  const { data: selectedProject } = useProjectDetailQuery({
    ref: selectedProjectRef ?? undefined,
  })

  const startDate = useMemo(() => {
    if (!dateRange?.period_start?.date) return undefined
    return new Date(dateRange.period_start.date).toISOString().slice(0, -5) + 'Z'
  }, [dateRange])

  const endDate = useMemo(() => {
    if (!dateRange?.period_end?.date) return undefined
    return new Date(dateRange.period_end.date).toISOString().slice(0, -5) + 'Z'
  }, [dateRange])

  const {
    data: orgDailyStats,
    error: orgDailyStatsError,
    isPending: isLoadingOrgDailyStats,
    isError: isErrorOrgDailyStats,
  } = useOrgDailyStatsQuery({
    orgSlug: slug,
    projectRef: selectedProjectRef ?? undefined,
    startDate,
    endDate,
  })

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="pt-8">
          <ScaffoldTitle>Usage</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <div className="sticky top-0 border-b bg-sidebar z-1">
        <ScaffoldContainer>
          <div className="py-4 flex items-center space-x-4">
            {isLoadingPermissions ? null : !canReadUsage ? (
              <NoPermission resourceText="view organization usage" />
            ) : (
              <div className="flex items-center gap-2">
                <DateRangePicker
                  onChange={setDateRange}
                  value={TIME_PERIODS_REPORTS[0].key}
                  options={[...TIME_PERIODS_REPORTS]}
                  className="w-48!"
                />

                <OrganizationProjectSelector
                  open={openProjectSelector}
                  setOpen={setOpenProjectSelector}
                  selectedRef={selectedProjectRef}
                  onSelect={(project) => setSelectedProjectRef(project.ref)}
                  renderTrigger={({ listboxId, open }) => (
                    <Button
                      block
                      type="default"
                      role="combobox"
                      size="tiny"
                      aria-expanded={open}
                      aria-controls={listboxId}
                      className="justify-between w-[180px]"
                      iconRight={<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                    >
                      {!selectedProject ? 'All projects' : selectedProject?.name}
                    </Button>
                  )}
                  renderRow={(project) => {
                    const isSelected = selectedProjectRef === project.ref
                    return (
                      <div className="w-full flex items-center justify-between">
                        <span className={cn('truncate', isSelected ? 'max-w-60' : 'max-w-64')}>
                          {project.name}
                        </span>
                        {isSelected && <Check size={16} />}
                      </div>
                    )
                  }}
                  renderActions={() => (
                    <CommandGroup>
                      <CommandItem
                        className="cursor-pointer flex items-center justify-between w-full"
                        onSelect={() => {
                          setOpenProjectSelector(false)
                          setSelectedProjectRef(null)
                        }}
                        onClick={() => {
                          setOpenProjectSelector(false)
                          setSelectedProjectRef(null)
                        }}
                      >
                        All projects
                        {!selectedProjectRef && <Check size={16} />}
                      </CommandItem>
                    </CommandGroup>
                  )}
                />
              </div>
            )}
          </div>
        </ScaffoldContainer>
      </div>

      {isErrorOrgDailyStats && (
        <ScaffoldContainer>
          <ScaffoldSection isFullWidth className="pb-0">
            <AlertError
              error={orgDailyStatsError}
              subject="Failed to retrieve usage statistics for organization"
            />
          </ScaffoldSection>
        </ScaffoldContainer>
      )}

      <Compute orgDailyStats={orgDailyStats} isLoadingOrgDailyStats={isLoadingOrgDailyStats} />

      <Egress
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={SELF_HOST_SUBSCRIPTION}
        currentBillingCycleSelected={false}
        orgDailyStats={orgDailyStats}
        isLoadingOrgDailyStats={isLoadingOrgDailyStats}
        startDate={startDate}
        endDate={endDate}
      />

      <SizeAndCounts
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={SELF_HOST_SUBSCRIPTION}
        currentBillingCycleSelected={false}
        orgDailyStats={orgDailyStats}
        isLoadingOrgDailyStats={isLoadingOrgDailyStats}
        startDate={startDate}
        endDate={endDate}
      />

      <Activity
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={SELF_HOST_SUBSCRIPTION}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={false}
        orgDailyStats={orgDailyStats}
        isLoadingOrgDailyStats={isLoadingOrgDailyStats}
      />
    </>
  )
}
