import { useParams } from 'common'
import { BarChart, Shield } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { AiIconAnimation, Badge, Button, Card, CardContent, CardHeader, CardTitle, cn } from 'ui'
import { Row } from 'ui-patterns'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { Markdown } from '../Markdown'
import { LINTER_LEVELS } from '@/components/interfaces/Linter/Linter.constants'
import { createLintSummaryPrompt } from '@/components/interfaces/Linter/Linter.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import type { AdvisorItem } from '@/components/ui/AdvisorPanel/AdvisorPanel.types'
import {
  createAdvisorLintItems,
  getAdvisorItemDisplayTitle,
  MAX_HOMEPAGE_ADVISOR_ITEMS,
  severityBadgeVariants,
  severityColorClasses,
  sortAdvisorItems,
} from '@/components/ui/AdvisorPanel/AdvisorPanel.utils'
import { useAdvisorSignals } from '@/components/ui/AdvisorPanel/useAdvisorSignals'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import { useTrack } from '@/lib/telemetry/track'
import { useAdvisorStateSnapshot } from '@/state/advisor-state'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const AdvisorSection = ({ showEmptyState = false }: { showEmptyState?: boolean }) => {
  const { ref: projectRef } = useParams()
  const track = useTrack()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { setSelectedItem } = useAdvisorStateSnapshot()

  const { data: lints, isLoading: isLoadingLints } = useProjectLintsQuery(
    { projectRef },
    { enabled: !showEmptyState }
  )

  const { data: signalItems } = useAdvisorSignals({ projectRef, enabled: !showEmptyState })

  const advisorItems = useMemo<AdvisorItem[]>(() => {
    const criticalLintItems = createAdvisorLintItems(lints).filter(
      (item) => item.source === 'lint' && item.original.level === LINTER_LEVELS.ERROR
    )

    return sortAdvisorItems([...criticalLintItems, ...signalItems])
  }, [lints, signalItems])

  const visibleAdvisorItems = useMemo(
    () => advisorItems.slice(0, MAX_HOMEPAGE_ADVISOR_ITEMS),
    [advisorItems]
  )

  const totalIssues = advisorItems.length
  const hiddenIssuesCount = totalIssues - visibleAdvisorItems.length

  const titleContent = useMemo(() => {
    if (totalIssues === 0) return <h2>Advisor found no issues</h2>
    const issuesText = totalIssues === 1 ? 'issue' : 'issues'
    const numberDisplay = totalIssues.toString()
    return (
      <h2>
        Advisor found {numberDisplay} {issuesText}
      </h2>
    )
  }, [totalIssues])

  const handleAskAssistant = useCallback(() => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    track('advisor_assistant_button_clicked', {
      origin: 'homepage',
      issuesCount: totalIssues,
    })
  }, [track, openSidebar, totalIssues])

  const handleCardClick = useCallback(
    (item: AdvisorItem) => {
      setSelectedItem(item.id, item.source)
      openSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)

      const advisorCategory =
        item.source === 'lint'
          ? item.original.categories.includes('SECURITY')
            ? 'SECURITY'
            : item.original.categories.includes('PERFORMANCE')
              ? 'PERFORMANCE'
              : undefined
          : item.source === 'signal'
            ? 'SECURITY'
            : undefined
      const advisorType =
        item.source === 'signal'
          ? item.type
          : item.source === 'lint'
            ? item.original.name
            : item.title
      const advisorLevel = item.source === 'lint' ? item.original.level : undefined

      track('advisor_detail_opened', {
        origin: 'homepage',
        advisorSource: item.source,
        advisorCategory,
        advisorType,
        advisorLevel,
      })
    },
    [track, setSelectedItem, openSidebar]
  )

  if (showEmptyState) {
    return <EmptyState />
  }

  // [Joshen] Note that we're intentionally (for now) not waiting for advisor signals to load
  // render main content as long as the main lints have been fetched

  return (
    <div>
      {isLoadingLints ? (
        <ShimmeringLoader className="w-96 mb-6" />
      ) : (
        <div className="flex justify-between items-center mb-6">
          {titleContent}
          <Button type="default" icon={<AiIconAnimation />} onClick={handleAskAssistant}>
            Ask Assistant
          </Button>
        </div>
      )}

      {isLoadingLints ? (
        <div className="flex flex-col gap-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : visibleAdvisorItems.length > 0 ? (
        <>
          <Row maxColumns={4} minWidth={280}>
            {visibleAdvisorItems.map((item) => {
              const isLint = item.source === 'lint'
              const categoryLabel = item.tab === 'performance' ? 'PERFORMANCE' : 'SECURITY'
              const title = getAdvisorItemDisplayTitle(item)
              const description =
                item.source === 'signal' ? item.summary : isLint ? item.original.detail : ''
              const cardClasses =
                item.severity === 'critical'
                  ? 'bg-destructive-200 border-destructive-400'
                  : item.severity === 'warning'
                    ? 'border-warning-400'
                    : ''

              return (
                <Card
                  key={`${item.source}-${item.id}`}
                  className={cn(
                    'min-h-full flex flex-col items-stretch cursor-pointer h-64',
                    cardClasses
                  )}
                  onClick={() => {
                    handleCardClick(item)
                  }}
                >
                  <CardHeader className="border-b-0 shrink-0 flex flex-row gap-2 space-y-0 justify-between items-center">
                    <div className="flex flex-row items-center gap-3">
                      {item.tab === 'security' ? (
                        <Shield
                          size={16}
                          strokeWidth={1.5}
                          className={severityColorClasses[item.severity]}
                        />
                      ) : (
                        <BarChart
                          size={16}
                          strokeWidth={1.5}
                          className={severityColorClasses[item.severity]}
                        />
                      )}
                      <CardTitle className="text-foreground-light">{categoryLabel}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={severityBadgeVariants[item.severity]} className="w-fit">
                        {item.severity.toUpperCase()}
                      </Badge>
                      {isLint && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                        >
                          <AiAssistantDropdown
                            label="Ask Assistant"
                            iconOnly
                            tooltip="Help me fix this issue"
                            buildPrompt={() => createLintSummaryPrompt(item.original)}
                            onOpenAssistant={() => {
                              openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                              snap.newChat({
                                name: 'Summarise lint',
                                initialInput: createLintSummaryPrompt(item.original),
                              })
                              track('advisor_assistant_button_clicked', {
                                origin: 'homepage',
                                advisorCategory: item.original.categories[0],
                                advisorType: item.original.name,
                                advisorLevel: item.original.level,
                              })
                            }}
                            telemetrySource="advisor_section"
                            type="text"
                            className="w-7 h-7"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-16 flex flex-col justify-end flex-1 overflow-auto">
                    <h3 className="mb-1">{title}</h3>
                    <Markdown className="leading-6 text-sm text-foreground-light">
                      {description && description.replace(/\\`/g, '`')}
                    </Markdown>
                  </CardContent>
                </Card>
              )
            })}
          </Row>
          {hiddenIssuesCount > 0 && (
            <div className="mt-4 flex justify-end">
              <Button type="text" onClick={() => openSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)}>
                View {hiddenIssuesCount} more issue{hiddenIssuesCount !== 1 ? 's' : ''} in Advisor
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="bg-transparent h-64">
      <CardContent className="flex flex-col items-center justify-center gap-2 p-16 h-full">
        <Shield size={20} strokeWidth={1.5} className="text-foreground-muted" />
        <p className="text-sm text-foreground-light text-center">
          No security or performance issues found
        </p>
      </CardContent>
    </Card>
  )
}
