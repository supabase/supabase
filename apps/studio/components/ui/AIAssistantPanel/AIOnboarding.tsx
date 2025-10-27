import { motion } from 'framer-motion'
import { BarChart, FileText, Shield } from 'lucide-react'

import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { createLintSummaryPrompt } from 'components/interfaces/Linter/Linter.utils'
import { type Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { Button, Skeleton } from 'ui'
import { codeSnippetPrompts, defaultPrompts } from './AIAssistant.prompts'
import type { SqlSnippet } from './AIAssistant.types'

interface AIOnboardingProps {
  sqlSnippets?: SqlSnippet[]
  suggestions?: {
    title?: string
    prompts?: { label: string; description: string }[]
  }
  onValueChange: (value: string) => void
  onFocusInput?: () => void
}

export const AIOnboarding = ({
  sqlSnippets,
  suggestions,
  onValueChange,
  onFocusInput,
}: AIOnboardingProps) => {
  const prompts = suggestions?.prompts
    ? suggestions.prompts.map((suggestion) => ({
        title: suggestion.label,
        prompt: suggestion.description,
        icon: <FileText strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
      }))
    : sqlSnippets && sqlSnippets.length > 0
      ? codeSnippetPrompts
      : defaultPrompts

  const { ref: projectRef } = useParams()
  const {
    data: lints,
    isLoading: isLoadingLints,
    isFetching: isFetchingLints,
  } = useProjectLintsQuery({ projectRef })
  const isLintsLoading = isLoadingLints || isFetchingLints

  const errorLints: Lint[] = (lints?.filter((lint) => lint.level === LINTER_LEVELS.ERROR) ??
    []) as Lint[]
  const securityErrorLints = errorLints.filter((lint) => lint.categories?.[0] === 'SECURITY')
  const performanceErrorLints = errorLints.filter((lint) => lint.categories?.[0] !== 'SECURITY')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full flex-1 max-h-full min-h-full px-4 flex flex-col gap-0">
        <div className="mt-auto w-full space-y-6 py-8 ">
          <h2 className="heading-section text-foreground mx-4">How can I assist you?</h2>
          {suggestions?.prompts?.length ? (
            <div>
              <h3 className="heading-meta text-foreground-light mb-3 mx-4">Suggestions</h3>
              {prompts.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Button
                    size="small"
                    type="text"
                    className="w-full justify-start border-b hover:border-b-0 hover:rounded-md rounded-none"
                    icon={
                      <FileText strokeWidth={1.5} size={14} className="text-foreground-light" />
                    }
                    onClick={() => {
                      onValueChange(item.prompt)
                      onFocusInput?.()
                    }}
                  >
                    {item.title}
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <>
              {isLintsLoading ? (
                <div className="px-4 flex flex-col gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={`loader-${index}`} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {performanceErrorLints.length > 0 && (
                    <div className="mb-4">
                      <h3 className="heading-meta text-foreground-light mb-3 mx-4">
                        Improve Performance
                      </h3>
                      {performanceErrorLints.map((lint, index) => {
                        return (
                          <Button
                            key={`${lint.name}-${index}`}
                            size="small"
                            type="text"
                            className="w-full justify-start"
                            icon={
                              <BarChart
                                strokeWidth={1.5}
                                size={14}
                                className="text-foreground-light"
                              />
                            }
                            onClick={() => {
                              onValueChange(createLintSummaryPrompt(lint))
                              onFocusInput?.()
                            }}
                          >
                            {lint.detail ? lint.detail.replace('\\`', '') : lint.title}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {securityErrorLints.length > 0 && (
                    <div className="mb-4">
                      <h3 className="heading-meta text-foreground-light mb-3 mx-4">
                        Improve Security
                      </h3>
                      {securityErrorLints.map((lint, index) => {
                        return (
                          <Button
                            key={`${lint.name}-${index}`}
                            size="small"
                            type="text"
                            className="w-full justify-start"
                            icon={<Shield strokeWidth={1.5} size={14} className="text-warning" />}
                            onClick={() => {
                              onValueChange(createLintSummaryPrompt(lint))
                              onFocusInput?.()
                            }}
                          >
                            {lint.detail ? lint.detail.replace(/\\`/g, '') : lint.title}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  <div>
                    <h3 className="heading-meta text-foreground-light mb-3 mx-4">Ideas</h3>
                    {prompts.map((item, index) => (
                      <Button
                        key={`${item.title}-${index}`}
                        size="small"
                        type="text"
                        className="w-full justify-start"
                        icon={
                          <FileText strokeWidth={1.5} size={14} className="text-foreground-light" />
                        }
                        onClick={() => {
                          onValueChange(item.prompt)
                          onFocusInput?.()
                        }}
                      >
                        {item.title}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
