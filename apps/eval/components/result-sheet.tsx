'use client'

import React from 'react'
import {
  Badge,
  HoverCard_Shadcn_ as HoverCard,
  HoverCardTrigger_Shadcn_ as HoverCardTrigger,
  HoverCardContent_Shadcn_ as HoverCardContent,
  CodeBlock,
} from 'ui'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'
import { Clock, Zap } from 'lucide-react'
import type { Experiment } from '../constants/default-experiments'

interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

interface Step {
  stepNumber: number
  text: string
  toolCalls: Array<any>
  toolResults: Array<any>
  finishReason: string
}

interface ExperimentResult {
  score: number
  reason: string
  stepAnalysis: string
  usage?: TokenUsage
  assistantResponse?: string
  steps?: Step[]
  toolCalls?: Array<any>
  finishReason?: string
  duration?: number
}

interface ResultSheetProps {
  selectedResult: {
    experiment: Experiment
    modelId: string
    result: ExperimentResult
  } | null
  onClose: () => void
}

export function ResultSheet({ selectedResult, onClose }: ResultSheetProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-brand border-brand'
    if (score >= 6) return 'bg-warning border-warning'
    return 'bg-destructive border-destructive'
  }

  return (
    <Sheet open={!!selectedResult} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="md" className="w-[800px] sm:w-[800px] overflow-y-auto">
        {selectedResult && (
          <>
            <SheetHeader className="p-8">
              <SheetTitle className="tracking-tight font-medium">
                {selectedResult.experiment.name} - {selectedResult.modelId}
              </SheetTitle>
              <SheetDescription>
                Detailed evaluation results and assistant response
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-8 p-8">
              {/* Score and Metrics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`${getScoreColor(selectedResult.result.score)} text-white text-lg py-2 px-6`}
                  >
                    Score: {selectedResult.result.score}/10
                  </Badge>
                  {selectedResult.result.usage && (
                    <Badge variant="outline" className="flex items-center gap-2 text-lg py-2 px-6">
                      <Zap className="h-3 w-3" />
                      {selectedResult.result.usage.totalTokens} tokens
                    </Badge>
                  )}
                  {selectedResult.result.duration && (
                    <Badge variant="outline" className="flex items-center gap-2 text-lg py-2 px-6">
                      <Clock className="h-3 w-3" />
                      {formatDuration(selectedResult.result.duration)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Evaluation Reason */}
              <div className="space-y-2">
                <h4 className="font-medium">Evaluation Reason</h4>
                <p className="text-foreground-light">{selectedResult.result.reason}</p>
              </div>

              {/* Usage Details */}
              {selectedResult.result.usage && (
                <div className="space-y-2">
                  <h4 className="font-medium">Token Usage</h4>
                  <div className="grid grid-cols-3 text-sm bg-muted rounded-lg">
                    <div className="p-3 rounded text-center border-r">
                      <div className="font-medium">{selectedResult.result.usage.promptTokens}</div>
                      <div className="text-xs text-foreground-light">Prompt Tokens</div>
                    </div>
                    <div className="p-3 rounded text-center border-r last:border-r-0">
                      <div className="font-medium">
                        {selectedResult.result.usage.completionTokens}
                      </div>
                      <div className="text-xs text-foreground-light">Completion Tokens</div>
                    </div>
                    <div className="p-3 rounded text-center">
                      <div className="font-medium">{selectedResult.result.usage.totalTokens}</div>
                      <div className="text-xs text-foreground-light">Total Tokens</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assistant Response Steps */}
              {selectedResult.result.steps && selectedResult.result.steps.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium mb-4">Assistant Response Steps</h4>
                  <div className="border rounded-lg bg-surface-100/50">
                    {selectedResult.result.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex gap-16 items-start p-6 border-b last:border-b-0"
                      >
                        <div className="w-1/4 shrink-0">
                          <h5 className="font-mono text-sm uppercase">Step {step.stepNumber}</h5>
                          {step.finishReason && (
                            <span className="text-xs text-foreground-light">
                              {step.finishReason}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="whitespace-pre-wrap text-foreground-light">{step.text}</p>
                          {step.toolCalls && step.toolCalls.length > 0 && (
                            <div className="flex flex-wrap mt-4">
                              {step.toolCalls.map((toolCall) => (
                                <HoverCard key={toolCall.toolName}>
                                  <HoverCardTrigger asChild>
                                    <div className="text-xs font-mono uppercase bg-muted rounded py-2 px-3 cursor-pointer">
                                      {toolCall.toolName}
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="max-w-lg w-[300px] p-0 text-foreground-light text-xs whitespace-pre-wrap">
                                    <CodeBlock
                                      language="json"
                                      className="word-break-all w-full border-0 bg-transparent text-xs h-[200px] overflow-auto"
                                    >
                                      {JSON.stringify(toolCall)}
                                    </CodeBlock>
                                  </HoverCardContent>
                                </HoverCard>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Assistant Response */}
              {/* {selectedResult.result.assistantResponse && (
                <div className="space-y-2">
                  <h4 className="font-medium">Complete Assistant Response</h4>
                  <div className="bg-muted p-4 rounded max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {selectedResult.result.assistantResponse}
                    </pre>
                  </div>
                </div>
              )} */}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
