import { AlertTriangle, ChevronLeft, ChevronRight, Gauge, Inbox, Shield, X } from 'lucide-react'
import { useMemo } from 'react'

import LintDetail from 'components/interfaces/Linter/LintDetail'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { AdvisorSeverity, AdvisorTab, useAdvisorStateSnapshot } from 'state/advisor-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Badge, Button, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { EmptyAdvisor } from './EmptyAdvisor'

type AdvisorItem = {
  id: string
  title: string
  severity: AdvisorSeverity
  createdAt?: number
  tab: Exclude<AdvisorTab, 'all'>
  source: 'lint'
  original: Lint
}

const severityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
]

const severityOrder: Record<AdvisorSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const severityLabels: Record<AdvisorSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

const severityBadgeVariants: Record<AdvisorSeverity, 'destructive' | 'warning' | 'default'> = {
  critical: 'destructive',
  warning: 'warning',
  info: 'default',
}

const severityColorClasses: Record<AdvisorSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-foreground-light',
}

const tabIconMap: Record<Exclude<AdvisorTab, 'all'>, React.ElementType> = {
  security: Shield,
  performance: Gauge,
  messages: Inbox,
}

const lintLevelToSeverity = (level: Lint['level']): AdvisorSeverity => {
  switch (level) {
    case 'ERROR':
      return 'critical'
    case 'WARN':
      return 'warning'
    default:
      return 'info'
  }
}

export const AdvisorPanel = () => {
  const {
    activeTab,
    severityFilters,
    selectedItemId,
    setActiveTab,
    setSeverityFilters,
    clearSeverityFilters,
    setSelectedItemId,
  } = useAdvisorStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { activeSidebar, closeSidebar } = useSidebarManagerSnapshot()

  const isSidebarOpen = activeSidebar?.id === SIDEBAR_KEYS.ADVISOR_PANEL

  const {
    data: lintData,
    isLoading: isLintsLoading,
    isError: isLintsError,
  } = useProjectLintsQuery(
    { projectRef: project?.ref },
    { enabled: isSidebarOpen && !!project?.ref }
  )

  const lintItems = useMemo<AdvisorItem[]>(() => {
    if (!lintData) return []

    return lintData
      .map((lint): AdvisorItem | null => {
        const categories = lint.categories || []
        const tab = categories.includes('SECURITY')
          ? ('security' as const)
          : categories.includes('PERFORMANCE')
            ? ('performance' as const)
            : undefined

        if (!tab) return null

        return {
          id: lint.cache_key,
          title: lint.detail,
          severity: lintLevelToSeverity(lint.level),
          createdAt: undefined,
          tab,
          source: 'lint' as const,
          original: lint,
        }
      })
      .filter((item): item is AdvisorItem => item !== null)
  }, [lintData])

  const combinedItems = useMemo<AdvisorItem[]>(() => {
    const all = [...lintItems]

    return all.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff

      const createdDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0)
      if (createdDiff !== 0) return createdDiff

      return a.title.localeCompare(b.title)
    })
  }, [lintItems])

  const filteredItems = useMemo<AdvisorItem[]>(() => {
    return combinedItems.filter((item) => {
      if (severityFilters.length > 0 && !severityFilters.includes(item.severity)) {
        return false
      }

      if (activeTab === 'all') return true

      return item.tab === activeTab
    })
  }, [combinedItems, severityFilters, activeTab])

  const itemsFilteredByTabOnly = useMemo<AdvisorItem[]>(() => {
    return combinedItems.filter((item) => {
      if (activeTab === 'all') return true
      return item.tab === activeTab
    })
  }, [combinedItems, activeTab])

  const hiddenItemsCount = itemsFilteredByTabOnly.length - filteredItems.length

  const selectedItem = combinedItems.find((item) => item.id === selectedItemId)
  const isDetailView = !!selectedItem

  const isLoading = isLintsLoading
  const isError = isLintsError

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AdvisorTab)
  }

  const handleBackToList = () => {
    setSelectedItemId(undefined)
  }

  const handleClose = () => {
    closeSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {isDetailView ? (
        <>
          <div className="border-b px-4 py-3 flex items-center gap-3">
            <ButtonTooltip
              type="text"
              className="w-7 h-7 p-0 flex justify-center items-center"
              icon={<ChevronLeft size={16} strokeWidth={1.5} aria-hidden={true} />}
              onClick={handleBackToList}
              tooltip={{ content: { side: 'bottom', text: 'Back to list' } }}
            />
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <div className="flex-1">
                <span className="heading-default">{selectedItem?.title}</span>
              </div>
              {selectedItem && (
                <Badge variant={severityBadgeVariants[selectedItem.severity]}>
                  {severityLabels[selectedItem.severity]}
                </Badge>
              )}
            </div>
            <ButtonTooltip
              type="text"
              className="w-7 h-7 p-0"
              icon={<X strokeWidth={1.5} />}
              onClick={handleClose}
              tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedItem ? (
              <AdvisorDetail item={selectedItem} projectRef={project?.ref ?? ''} />
            ) : (
              <div className="px-6 py-8">
                <p className="text-sm text-foreground-light">
                  Select an advisor item to view more details.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="border-b">
            <div className="flex items-center justify-between gap-3 px-4 h-[46px]">
              <Tabs_Shadcn_ value={activeTab} onValueChange={handleTabChange} className="h-full">
                <TabsList_Shadcn_ className="border-b-0 gap-4 h-full">
                  <TabsTrigger_Shadcn_ value="all" className="h-full text-xs">
                    All
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="security" className="h-full text-xs">
                    Security
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="performance" className="h-full text-xs">
                    Performance
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
              </Tabs_Shadcn_>
              <div className="flex items-center gap-2">
                <FilterPopover
                  name="Severity"
                  options={severityOptions}
                  activeOptions={[...severityFilters]}
                  valueKey="value"
                  labelKey="label"
                  onSaveFilters={(values) => setSeverityFilters(values as AdvisorSeverity[])}
                />
                <ButtonTooltip
                  type="text"
                  className="w-7 h-7 p-0"
                  icon={<X strokeWidth={1.5} />}
                  onClick={handleClose}
                  tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div>
                <GenericSkeletonLoader className="w-full p-4" />
              </div>
            ) : isError ? (
              <div className="my-8 mx-4 flex flex-col items-center gap-2">
                <AlertTriangle className="text-destructive" />
                <h2 className="text-base text-foreground-light">Error loading advisories</h2>
                <p className="text-sm text-foreground-lighter">Please try again later.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyAdvisor
                activeTab={activeTab}
                hasFilters={severityFilters.length > 0}
                onClearFilters={clearSeverityFilters}
              />
            ) : (
              <>
                <div className="flex flex-col">
                  {filteredItems.map((item) => {
                    const SeverityIcon = tabIconMap[item.tab]
                    const severityClass = severityColorClasses[item.severity]
                    return (
                      <div key={item.id} className="border-b">
                        <Button
                          type="text"
                          className="justify-start w-full block rounded-none h-auto py-3 px-4 text-foreground-light hover:text-foreground"
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <SeverityIcon
                                size={16}
                                strokeWidth={1.5}
                                className={cn('flex-shrink-0', severityClass)}
                              />
                              <span className="truncate">{item.title}</span>
                            </div>
                            <ChevronRight
                              size={16}
                              strokeWidth={1.5}
                              className="flex-shrink-0 text-foreground-lighter"
                            />
                          </div>
                        </Button>
                      </div>
                    )
                  })}
                </div>
                {severityFilters.length > 0 && hiddenItemsCount > 0 && (
                  <div className="px-4 py-3">
                    <Button type="text" className="w-full" onClick={clearSeverityFilters}>
                      Show {hiddenItemsCount} more issue{hiddenItemsCount !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface AdvisorDetailProps {
  item: AdvisorItem
  projectRef: string
}

const AdvisorDetail = ({ item, projectRef }: AdvisorDetailProps) => {
  if (item.source === 'lint') {
    const lint = item.original as Lint
    return (
      <div className="px-6 py-6">
        <LintDetail lint={lint} projectRef={projectRef} />
      </div>
    )
  }
}
