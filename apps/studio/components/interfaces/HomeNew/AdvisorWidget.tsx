import { BarChart, Shield } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { LintCategoryBadge, lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
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

// Returns the first sentence of the provided text. Uses Intl.Segmenter when available
// and falls back to a regex that avoids splitting on intra-word dots (e.g. `public.messages`).
const getFirstSentence = (text: string | undefined | null): string | undefined | null => {
  if (!text) return text
  try {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      // @ts-ignore - TS may not have Intl.Segmenter in lib by default
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })
      // @ts-ignore
      const iterator = segmenter.segment(text)[Symbol.iterator]()
      const first = iterator.next()
      if (!first.done && first.value && first.value.segment) {
        return String(first.value.segment).trim()
      }
    }
  } catch (_) {
    // no-op; fall back to regex below
  }

  // Fallback: find first sentence terminator that is followed by whitespace or end of string.
  // This avoids splitting on things like `public.messages` where '.' is not followed by whitespace.
  const match = text.match(/[.!?](?=\s|$)/)
  if (match && typeof match.index === 'number') {
    return text.slice(0, match.index + 1).trim()
  }
  return text
}

export const AdvisorWidget = () => {
  const { ref: projectRef } = useParams()
  const { data: lints, isLoading: isLoadingLints } = useProjectLintsQuery({ projectRef })
  const snap = useAiAssistantStateSnapshot()

  const [selectedLint, setSelectedLint] = useState<Lint | null>(null)

  const securityLints = useMemo(
    () => (lints ?? []).filter((lint: Lint) => lint.categories.includes('SECURITY')),
    [lints]
  )
  const performanceLints = useMemo(
    () => (lints ?? []).filter((lint: Lint) => lint.categories.includes('PERFORMANCE')),
    [lints]
  )

  const securityErrorCount = useMemo(
    () => securityLints.filter((lint: Lint) => lint.level === LINTER_LEVELS.ERROR).length,
    [securityLints]
  )
  const performanceErrorCount = useMemo(
    () => performanceLints.filter((lint: Lint) => lint.level === LINTER_LEVELS.ERROR).length,
    [performanceLints]
  )

  const combinedIssues: Lint[] = useMemo(() => {
    const combined = [...securityLints, ...performanceLints]
    return combined.filter((lint) => lint.level === LINTER_LEVELS.ERROR)
  }, [securityLints, performanceLints])

  const totalErrors = securityErrorCount + performanceErrorCount

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

  const createLintSummaryPrompt = useCallback((lint: Lint) => {
    const title = lintInfoMap.find((item) => item.name === lint.name)?.title ?? lint.title
    const entity =
      (lint.metadata &&
        (lint.metadata.entity ||
          (lint.metadata.schema &&
            lint.metadata.name &&
            `${lint.metadata.schema}.${lint.metadata.name}`))) ||
      'N/A'
    const schema = lint.metadata?.schema ?? 'N/A'
    const issue = lint.detail ? lint.detail.replace(/\`/g, '`') : 'N/A'
    const description = lint.description ? lint.description.replace(/\`/g, '`') : 'N/A'
    return `Summarize the issue and suggest fixes for the following lint item:
  Title: ${title}
  Entity: ${entity}
  Schema: ${schema}
  Issue Details: ${issue}
  Description: ${description}`
  }, [])

  const handleAskAssistant = useCallback(() => {
    snap.toggleAssistant()
  }, [snap])

  const handleCardClick = useCallback((lint: Lint) => {
    setSelectedLint(lint)
  }, [])

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
      ) : combinedIssues.length > 0 ? (
        <>
          <Row columns={[3, 2, 1]}>
            {combinedIssues.map((lint) => {
              return (
                <Card
                  key={lint.cache_key}
                  className="h-full flex flex-col items-stretch h-64 cursor-pointer"
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
                      }}
                      tooltip={{
                        content: { side: 'bottom', text: 'Help me fix this issue' },
                      }}
                    />
                  </CardHeader>
                  <CardContent className="p-6 pt-16 flex flex-col justify-end flex-1 overflow-auto">
                    {lint.detail ? getFirstSentence(lint.detail) : lint.title}
                  </CardContent>
                </Card>
              )
            })}
          </Row>
          {selectedLint && (
            <Sheet open={selectedLint !== null} onOpenChange={() => setSelectedLint(null)}>
              <SheetContent>
                <SheetHeader>
                  <div className="flex items-center gap-4">
                    <SheetTitle>
                      {lintInfoMap.find((item) => item.name === selectedLint.name)?.title}
                    </SheetTitle>
                    <LintCategoryBadge category={selectedLint.categories[0]} />
                  </div>
                </SheetHeader>
                <SheetSection>
                  {selectedLint && projectRef && (
                    <LintDetail lint={selectedLint} projectRef={projectRef!} />
                  )}
                </SheetSection>
              </SheetContent>
            </Sheet>
          )}
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
