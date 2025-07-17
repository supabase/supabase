'use client'
import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Button } from 'ui'
import { Badge } from 'ui'
import { Alert, AlertDescription } from 'ui'
import { Loader2, Play, Zap, AlertCircle, Clock, Edit, X, Minus } from 'lucide-react'
import type { Experiment } from '../constants/default-experiments'
import type { ModelConfig } from './model-selector'
import Markdown from 'react-markdown'

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

interface ExperimentTableProps {
  experiments: Experiment[]
  selectedModels: ModelConfig[]
  onRunExperiment: (experimentId: string) => void
  onEditExperiment: (experimentId: string) => void
  onDeleteExperiment: (experimentId: string) => void
  onRemoveModel: (modelId: string) => void
  onResultClick: (experiment: Experiment, modelId: string, result: ExperimentResult) => void
}

export function ExperimentTable({
  experiments,
  selectedModels,
  onRunExperiment,
  onEditExperiment,
  onDeleteExperiment,
  onRemoveModel,
  onResultClick,
}: ExperimentTableProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500 border-brand'
    if (score >= 6) return 'bg-yellow-500 border-warning'
    return 'bg-red-500 border-destructive'
  }

  const renderModelResult = (experiment: Experiment, modelId: string) => {
    const isRunning = experiment.runningModels?.includes(modelId)
    const result = experiment.results?.[modelId]
    const error = experiment.errors?.[modelId]
    const startTime = experiment.startTimes?.[modelId]

    if (isRunning) {
      const elapsedTime = startTime ? Date.now() - startTime : 0
      return (
        <div className="flex flex-col items-center gap-2 p-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-foreground-light">Evaluating...</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono">
            <Clock className="h-3 w-3" />
            <span className="font-mono">{formatDuration(elapsedTime)}</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <Alert className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )
    }

    if (result) {
      return (
        <div
          className="p-2 cursor-pointer"
          onClick={() => onResultClick(experiment, modelId, result)}
        >
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <Badge className={`${getScoreColor(result.score)} text-white text-xs`}>
              {result.score}/10
            </Badge>
            {result.usage && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Zap className="h-2 w-2" />
                {result.usage.totalTokens}
              </Badge>
            )}
            {result.duration && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Clock className="h-2 w-2" />
                {formatDuration(result.duration)}
              </Badge>
            )}
          </div>
        </div>
      )
    }

    return <div className="p-2 text-sm text-foreground-lighter text-center">Not evaluated</div>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="text-xs">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="w-[150px] text-foreground-light font-mono text-xs uppercase">
              Experiment
            </TableHead>
            <TableHead className="w-[200px] text-foreground-light font-mono text-xs uppercase">
              User Prompt
            </TableHead>
            <TableHead className="w-[200px] text-foreground-light font-mono text-xs uppercase">
              Expected Outcome
            </TableHead>
            {selectedModels.map((model) => (
              <TableHead
                key={model.id}
                className="w-[200px] text-foreground-light font-mono text-xs uppercase truncate"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium flex-1 truncate">{model.name}</span>
                  <Button
                    size="tiny"
                    type="text"
                    onClick={() => onRemoveModel(model.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[100px] text-foreground-light font-mono text-xs uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiments.map((experiment) => (
            <TableRow key={experiment.id}>
              <TableCell className="font-medium text-base align-top">{experiment.name}</TableCell>
              <TableCell className="text-foreground-light prose prose-sm align-top">
                <Markdown>{experiment.userPrompt}</Markdown>
              </TableCell>
              <TableCell className="align-top text-foreground-light prose prose-sm prose-pre:border prose-p:mb-3 prose-pre:mt-0 prose-pre:max-h-32 prose-pre:overflow-y-auto prose-pre:text-foreground-light prose-pre:bg-surface-100/50">
                <Markdown>{experiment.expectedOutcome}</Markdown>
              </TableCell>
              {selectedModels.map((model) => (
                <TableCell key={model.id} className="border-l text-center">
                  {renderModelResult(experiment, model.id)}
                </TableCell>
              ))}
              <TableCell className="border-l w-fit">
                <div className="flex gap-1">
                  <Button
                    size="tiny"
                    loading={experiment.runningModels && experiment.runningModels.length > 0}
                    onClick={() => onRunExperiment(experiment.id)}
                    icon={<Play strokeWidth={1.5} size={16} />}
                    disabled={experiment.runningModels && experiment.runningModels.length > 0}
                  >
                    Run
                  </Button>
                  <Button
                    size="tiny"
                    type="default"
                    onClick={() => onEditExperiment(experiment.id)}
                    icon={<Edit strokeWidth={1.5} size={16} />}
                  ></Button>
                  <Button
                    size="tiny"
                    type="default"
                    onClick={() => onDeleteExperiment(experiment.id)}
                    icon={<X strokeWidth={1.5} size={16} />}
                  ></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
