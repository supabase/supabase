import { BarChart, Shield } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import {
  createLintSummaryPrompt,
  LintCategoryBadge,
  lintInfoMap,
} from 'components/interfaces/Linter/Linter.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Row } from 'ui-patterns'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import LintDetail from 'components/interfaces/Linter/LintDetail'

export const AdvisorSection = () => {
  const { ref: projectRef } = useParams()
  const { data: lints, isLoading: isLoadingLints } = useProjectLintsQuery({ projectRef })
  const snap = useAiAssistantStateSnapshot()
  const { mutate: sendEvent } = useSendEventMutation()
  const { data: organization } = useSelectedOrganizationQuery()

  const [selectedLint, setSelectedLint] = useState<Lint | null>(null)

  const errorLints: Lint[] = useMemo(() => {
    return lints?.filter((lint) => lint.level === LINTER_LEVELS.ERROR) ?? []
  }, [lints])

  const totalErrors = errorLints.length

  const titleContent = useMemo(() => {
    if (totalErrors === 0) return <h2>Assistant found no issues</h2>
    const issuesText = totalErrors === 1 ? 'issue' : 'issues'
    const numberDisplay = totalErrors.toString()
    return (
      <h2>
        Assistant found {numberDisplay} {issuesText}
      </h2>
    )
  }, [totalErrors])

  const handleAskAssistant = useCallback(() => {
    snap.toggleAssistant()
    if (projectRef && organization?.slug) {
      sendEvent({
        action: 'home_advisor_ask_assistant_clicked',
        properties: {
          issues_count: totalErrors,
        },
        groups: {
          project: projectRef,
          organization: organization.slug,
        },
      })
    }
  }, [snap, sendEvent, projectRef, organization, totalErrors])

  const handleCardClick = useCallback(
    (lint: Lint) => {
      setSelectedLint(lint)
      if (projectRef && organization?.slug) {
        sendEvent({
          action: 'home_advisor_issue_card_clicked',
          properties: {
            issue_category: lint.categories[0] || 'UNKNOWN',
            issue_name: lint.name,
            issues_count: totalErrors,
          },
          groups: {
            project: projectRef,
            organization: organization.slug,
          },
        })
      }
    },
    [sendEvent, projectRef, organization]
  )

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
                    <ButtonTooltip
                      type="text"
                      className="w-7 h-7"
                      icon={<AiIconAnimation size={16} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        snap.newChat({
                          name: 'Summarize lint',
                          open: true,
                          initialInput: createLintSummaryPrompt(lint),
                        })
                        if (projectRef && organization?.slug) {
                          sendEvent({
                            action: 'home_advisor_fix_issue_clicked',
                            properties: {
                              issue_category: lint.categories[0] || 'UNKNOWN',
                              issue_name: lint.name,
                            },
                            groups: {
                              project: projectRef,
                              organization: organization.slug,
                            },
                          })
                        }
                      }}
                      tooltip={{
                        content: { side: 'bottom', text: 'Help me fix this issue' },
                      }}
                    />
                  </CardHeader>
                  <CardContent className="p-6 pt-16 flex flex-col justify-end flex-1 overflow-auto">
                    {lint.detail ? lint.detail.substring(0, 100) : lint.title}
                    {lint.detail && lint.detail.length > 100 && '...'}
                  </CardContent>
                </Card>
              )
            })}
          </Row>
          <Sheet open={selectedLint !== null} onOpenChange={() => setSelectedLint(null)}>
            <SheetContent>
              {selectedLint && (
                <>
                  <SheetHeader>
                    <div className="flex items-center gap-4">
                      <SheetTitle>
                        {lintInfoMap.find((item) => item.name === selectedLint.name)?.title ??
                          'Unknown'}
                      </SheetTitle>
                      <LintCategoryBadge category={selectedLint.categories[0]} />
                    </div>
                  </SheetHeader>
                  <SheetSection>
                    {selectedLint && projectRef && (
                      <LintDetail
                        lint={selectedLint}
                        projectRef={projectRef!}
                        onAskAssistant={() => setSelectedLint(null)}
                      />
                    )}
                  </SheetSection>
                </>
              )}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Card className="bg-transparent">
          <CardContent className="flex flex-col items-center justify-center gap-2 p-16">
            <Shield size={20} strokeWidth={1.5} className="text-foreground-muted" />
            <p className="text-sm text-foreground-light text-center">
              No security or performance errors found
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
