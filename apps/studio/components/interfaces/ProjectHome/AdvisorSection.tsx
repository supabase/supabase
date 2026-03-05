import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { createLintSummaryPrompt } from 'components/interfaces/Linter/Linter.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useTrack } from 'lib/telemetry/track'
import { BarChart, Shield } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useAdvisorStateSnapshot } from 'state/advisor-state'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, Button, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Row } from 'ui-patterns'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { Markdown } from '../Markdown'

export const AdvisorSection = ({ showEmptyState = false }: { showEmptyState?: boolean }) => {
  const { ref: projectRef } = useParams()
  const { data: lints, isPending: isLoadingLints } = useProjectLintsQuery(
    {
      projectRef,
    },
    {
      enabled: !showEmptyState,
    }
  )
  const track = useTrack()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { setSelectedItem } = useAdvisorStateSnapshot()

  const errorLints: Lint[] = useMemo(() => {
    return lints?.filter((lint) => lint.level === LINTER_LEVELS.ERROR) ?? []
  }, [lints])

  const totalErrors = errorLints.length

  const titleContent = useMemo(() => {
    if (totalErrors === 0) return <h2>Advisor found no issues</h2>
    const issuesText = totalErrors === 1 ? 'issue' : 'issues'
    const numberDisplay = totalErrors.toString()
    return (
      <h2>
        Advisor found {numberDisplay} {issuesText}
      </h2>
    )
  }, [totalErrors])

  const handleAskAssistant = useCallback(() => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    track('advisor_assistant_button_clicked', {
      origin: 'homepage',
      issuesCount: totalErrors,
    })
  }, [track, openSidebar, totalErrors])

  const handleCardClick = useCallback(
    (lint: Lint) => {
      setSelectedItem(lint.cache_key, 'lint')
      openSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
      track('advisor_detail_opened', {
        origin: 'homepage',
        advisorSource: 'lint',
        advisorCategory: lint.categories[0],
        advisorType: lint.name,
        advisorLevel: lint.level,
      })
    },
    [track, setSelectedItem, openSidebar]
  )

  if (showEmptyState) {
    return <EmptyState />
  }

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
        <div className="flex flex-col p-4 gap-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : errorLints.length > 0 ? (
        <>
          <Row columns={[3, 2, 1]}>
            {errorLints.map((lint) => {
              return (
                <Card
                  key={lint.cache_key}
                  className="min-h-full flex flex-col items-stretch cursor-pointer h-64"
                  onClick={() => {
                    handleCardClick(lint)
                  }}
                >
                  <CardHeader className="border-b-0 shrink-0 flex flex-row gap-2 space-y-0 justify-between items-center">
                    <div className="flex flex-row items-center gap-3">
                      {lint.categories[0] === 'SECURITY' ? (
                        <Shield size={16} strokeWidth={1.5} className="text-foreground-muted" />
                      ) : (
                        <BarChart size={16} strokeWidth={1.5} className="text-foreground-muted" />
                      )}
                      <CardTitle className="text-foreground-light">{lint.categories[0]}</CardTitle>
                    </div>
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
                        buildPrompt={() => createLintSummaryPrompt(lint)}
                        onOpenAssistant={() => {
                          openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                          snap.newChat({
                            name: 'Summarize lint',
                            initialInput: createLintSummaryPrompt(lint),
                          })
                          track('advisor_assistant_button_clicked', {
                            origin: 'homepage',
                            advisorCategory: lint.categories[0],
                            advisorType: lint.name,
                            advisorLevel: lint.level,
                          })
                        }}
                        telemetrySource="advisor_section"
                        type="text"
                        className="w-7 h-7"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-16 flex flex-col justify-end flex-1 overflow-auto">
                    <h3 className="mb-1">{lint.title}</h3>
                    <Markdown className="leading-6 text-sm text-foreground-light">
                      {lint.detail && lint.detail.replace(/\\`/g, '`')}
                    </Markdown>
                  </CardContent>
                </Card>
              )
            })}
          </Row>
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
          No security or performance errors found
        </p>
      </CardContent>
    </Card>
  )
}
