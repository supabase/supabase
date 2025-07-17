'use client'

import { useState, useRef } from 'react'
import { Button } from 'ui'
import { Label_Shadcn_ as Label } from 'ui'
import {
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'
import { DEFAULT_EXPERIMENTS, type Experiment } from '@/constants/default-experiments'
import { ModelSelector, type ModelConfig } from '@/components/model-selector'
import { ExperimentForm } from '@/components/experiment-form'
import { ExperimentTable } from '@/components/experiment-table'
import { ResultSheet } from '@/components/result-sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'ui'

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

type OptInLevel = 'disabled' | 'schema' | 'schema_and_logs' | 'schema_and_logs_data'

export default function EvaluationFramework() {
  const [experiments, setExperiments] = useState<Experiment[]>(DEFAULT_EXPERIMENTS)
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([
    { id: 'haiku', provider: 'bedrock', name: 'us.anthropic.claude-3-5-haiku-20241022-v1:0' },
  ])
  const [optInLevel, setOptInLevel] = useState<OptInLevel>('schema_and_logs')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    userPrompt: '',
    expectedOutcome: '',
  })
  const [editingExperiment, setEditingExperiment] = useState<string | null>(null)
  const [editExperiment, setEditExperiment] = useState({
    name: '',
    userPrompt: '',
    expectedOutcome: '',
  })
  const [selectedResult, setSelectedResult] = useState<{
    experiment: Experiment
    modelId: string
    result: ExperimentResult
  } | null>(null)

  // Timer refs for tracking elapsed time during evaluation
  const timerRefs = useRef<Record<string, Record<string, NodeJS.Timeout>>>({})

  const startTimer = (experimentId: string, modelId: string) => {
    if (!timerRefs.current[experimentId]) {
      timerRefs.current[experimentId] = {}
    }

    // Clear any existing timer
    if (timerRefs.current[experimentId][modelId]) {
      clearInterval(timerRefs.current[experimentId][modelId])
    }

    const startTime = Date.now()

    // Update start time in state
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === experimentId
          ? {
              ...exp,
              startTimes: { ...exp.startTimes, [modelId]: startTime },
            }
          : exp
      )
    )

    // Start interval timer for UI updates
    timerRefs.current[experimentId][modelId] = setInterval(() => {
      setExperiments((prev) =>
        prev.map((exp) => {
          if (exp.id === experimentId && exp.startTimes?.[modelId]) {
            // Force re-render to update timer display
            return { ...exp }
          }
          return exp
        })
      )
    }, 100) // Update every 100ms for smooth timer display
  }

  const stopTimer = (experimentId: string, modelId: string) => {
    if (timerRefs.current[experimentId]?.[modelId]) {
      clearInterval(timerRefs.current[experimentId][modelId])
      delete timerRefs.current[experimentId][modelId]
    }
  }

  const runExperiment = async (experimentId: string, model?: string) => {
    const modelsToRun = model ? [model] : selectedModels.map((m) => m.id)

    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === experimentId
          ? {
              ...exp,
              runningModels: [...(exp.runningModels || []), ...modelsToRun],
              errors: { ...exp.errors, ...Object.fromEntries(modelsToRun.map((m) => [m, ''])) },
            }
          : exp
      )
    )

    const experiment = experiments.find((exp) => exp.id === experimentId)
    if (!experiment) return

    // Run evaluations for all models in parallel
    const modelPromises = modelsToRun.map(async (modelId) => {
      // Start timer for this model
      const startTime = Date.now()
      startTimer(experimentId, modelId)

      try {
        console.log(`Running experiment "${experiment.name}" with model: ${modelId}`)

        const response = await fetch('/api/eval', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: experiment.userPrompt,
            expectedOutcome: experiment.expectedOutcome,
            provider: selectedModels.find((m) => m.id === modelId)?.provider || 'openai',
            model: selectedModels.find((m) => m.id === modelId)?.name || modelId,
            optInLevel: optInLevel,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()

        // Calculate duration using the start time we captured
        const endTime = Date.now()
        const duration = endTime - startTime

        console.log(`Duration for ${modelId}: ${duration}ms`)

        // Stop timer
        stopTimer(experimentId, modelId)

        // Return the result with modelId for updating state
        return {
          modelId,
          success: true,
          result: { ...result, duration },
        }
      } catch (error) {
        console.error(`Error running experiment with ${modelId}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

        // Calculate duration even on error using the start time we captured
        const endTime = Date.now()
        const duration = endTime - startTime

        console.log(`Duration for ${modelId} (error): ${duration}ms`)

        // Stop timer on error
        stopTimer(experimentId, modelId)

        // Return the error with modelId for updating state
        return {
          modelId,
          success: false,
          error: errorMessage,
        }
      }
    })

    // Wait for all models to complete and update state with all results at once
    const results = await Promise.allSettled(modelPromises)

    // Process all results and update state
    setExperiments((prev) =>
      prev.map((exp) => {
        if (exp.id !== experimentId) return exp

        const updatedResults = { ...exp.results }
        const updatedErrors = { ...exp.errors }
        const updatedStartTimes = { ...exp.startTimes }
        let updatedRunningModels = [...(exp.runningModels || [])]

        results.forEach((promiseResult, index) => {
          const modelId = modelsToRun[index]

          if (promiseResult.status === 'fulfilled') {
            const { success, result, error } = promiseResult.value

            if (success && result) {
              updatedResults[modelId] = result
              updatedErrors[modelId] = ''
            } else if (error) {
              updatedErrors[modelId] = error
            }
          } else {
            // Promise was rejected
            updatedErrors[modelId] = 'Request failed'
          }

          // Remove from running models
          updatedRunningModels = updatedRunningModels.filter((m) => m !== modelId)
          // Clear start time
          updatedStartTimes[modelId] = undefined
        })

        return {
          ...exp,
          results: updatedResults,
          errors: updatedErrors,
          runningModels: updatedRunningModels,
          startTimes: updatedStartTimes,
        }
      })
    )
  }

  const runAllExperiments = async () => {
    for (const experiment of experiments) {
      await runExperiment(experiment.id)
      // Add a small delay between experiments to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  const addExperiment = () => {
    if (
      !newExperiment.name.trim() ||
      !newExperiment.userPrompt.trim() ||
      !newExperiment.expectedOutcome.trim()
    ) {
      return
    }

    const experiment: Experiment = {
      id: Date.now().toString(),
      name: newExperiment.name.trim(),
      userPrompt: newExperiment.userPrompt.trim(),
      expectedOutcome: newExperiment.expectedOutcome.trim(),
    }

    setExperiments((prev) => [...prev, experiment])
    setNewExperiment({ name: '', userPrompt: '', expectedOutcome: '' })
  }

  const cancelAddExperiment = () => {
    setNewExperiment({ name: '', userPrompt: '', expectedOutcome: '' })
    setIsAddDialogOpen(false)
  }

  const deleteExperiment = (experimentId: string) => {
    // Clean up any running timers
    if (timerRefs.current[experimentId]) {
      Object.values(timerRefs.current[experimentId]).forEach(clearInterval)
      delete timerRefs.current[experimentId]
    }
    setExperiments((prev) => prev.filter((exp) => exp.id !== experimentId))
  }

  const startEditExperiment = (experimentId: string) => {
    const experiment = experiments.find((exp) => exp.id === experimentId)
    if (experiment) {
      setEditExperiment({
        name: experiment.name,
        userPrompt: experiment.userPrompt,
        expectedOutcome: experiment.expectedOutcome,
      })
      setEditingExperiment(experimentId)
    }
  }

  const saveEditExperiment = () => {
    if (
      !editExperiment.name.trim() ||
      !editExperiment.userPrompt.trim() ||
      !editExperiment.expectedOutcome.trim()
    ) {
      return
    }

    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === editingExperiment
          ? {
              ...exp,
              name: editExperiment.name.trim(),
              userPrompt: editExperiment.userPrompt.trim(),
              expectedOutcome: editExperiment.expectedOutcome.trim(),
              // Clear results when experiment is edited since they're no longer valid
              results: undefined,
              errors: undefined,
              runningModels: undefined,
              startTimes: undefined,
            }
          : exp
      )
    )

    setEditExperiment({ name: '', userPrompt: '', expectedOutcome: '' })
    setEditingExperiment(null)
  }

  const cancelEditExperiment = () => {
    setEditExperiment({ name: '', userPrompt: '', expectedOutcome: '' })
    setEditingExperiment(null)
  }

  const handleModelsChange = (models: ModelConfig[]) => {
    // Clean up any running timers for removed models
    const removedModels = selectedModels.filter((model) => !models.find((m) => m.id === model.id))
    removedModels.forEach((model) => {
      Object.keys(timerRefs.current).forEach((experimentId) => {
        if (timerRefs.current[experimentId][model.id]) {
          clearInterval(timerRefs.current[experimentId][model.id])
          delete timerRefs.current[experimentId][model.id]
        }
      })
    })

    // Clean up any results for removed models from all experiments
    setExperiments((prev) =>
      prev.map((exp) => ({
        ...exp,
        results: exp.results
          ? Object.fromEntries(
              Object.entries(exp.results).filter(([key]) => models.find((m) => m.id === key))
            )
          : undefined,
        errors: exp.errors
          ? Object.fromEntries(
              Object.entries(exp.errors).filter(([key]) => models.find((m) => m.id === key))
            )
          : undefined,
        runningModels: exp.runningModels?.filter((id) => models.find((m) => m.id === id)),
        startTimes: exp.startTimes
          ? Object.fromEntries(
              Object.entries(exp.startTimes).filter(([key]) => models.find((m) => m.id === key))
            )
          : undefined,
      }))
    )

    setSelectedModels(models)
  }

  const handleRemoveModel = (modelId: string) => {
    const updatedModels = selectedModels.filter((model) => model.id !== modelId)
    handleModelsChange(updatedModels)
  }

  const handleResultClick = (experiment: Experiment, modelId: string, result: ExperimentResult) => {
    setSelectedResult({ experiment, modelId, result })
  }

  const isAddFormValid =
    newExperiment.name.trim() &&
    newExperiment.userPrompt.trim() &&
    newExperiment.expectedOutcome.trim()

  const isEditFormValid =
    editExperiment.name.trim() &&
    editExperiment.userPrompt.trim() &&
    editExperiment.expectedOutcome.trim()

  return (
    <div className="mx-auto px-4">
      <div className="flex items-center justify-between py-4">
        <h1 className="font-medium">Evaluation Framework</h1>
        <div className="flex items-center gap-2">
          <ModelSelector selectedModels={selectedModels} onModelsChange={handleModelsChange} />
          <div className="flex items-center gap-2">
            {/* <Select value={optInLevel} onValueChange={(value: OptInLevel) => setOptInLevel(value)}>
              <SelectTrigger className="w-[180px]" id="opt-in-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="schema">Schema</SelectItem>
                <SelectItem value="schema_and_logs">Schema & Logs</SelectItem>
                <SelectItem value="schema_and_logs_data">Schema, Logs & Data</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
          {/* <ThemeToggle /> */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button type="default" size="small" disabled={isAddDialogOpen}>
                Add Experiment
              </Button>
            </DialogTrigger>
            <DialogContent size="large">
              <DialogHeader className="border-b">
                <DialogTitle>Add New Experiment</DialogTitle>
                <DialogDescription>Fill out the details for your new experiment.</DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <ExperimentForm
                  mode="add"
                  experiment={newExperiment}
                  onExperimentChange={setNewExperiment}
                  onSave={() => {
                    addExperiment()
                    setIsAddDialogOpen(false)
                  }}
                  onCancel={() => {
                    setNewExperiment({ name: '', userPrompt: '', expectedOutcome: '' })
                    setIsAddDialogOpen(false)
                  }}
                  isValid={isAddFormValid}
                />
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={runAllExperiments} size="small">
            Run All
          </Button>
        </div>
      </div>

      {editingExperiment && (
        <Dialog open={!!editingExperiment} onOpenChange={() => setEditingExperiment(null)}>
          <DialogContent size="large">
            <DialogHeader className="border-b">
              <DialogTitle>Add New Experiment</DialogTitle>
              <DialogDescription>Fill out the details for your new experiment.</DialogDescription>
            </DialogHeader>
            <div className="p-6">
              <ExperimentForm
                mode="edit"
                experiment={editExperiment}
                onExperimentChange={setEditExperiment}
                onSave={saveEditExperiment}
                onCancel={cancelEditExperiment}
                isValid={isEditFormValid}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ExperimentTable
        experiments={experiments}
        selectedModels={selectedModels}
        onRunExperiment={runExperiment}
        onEditExperiment={startEditExperiment}
        onDeleteExperiment={deleteExperiment}
        onRemoveModel={handleRemoveModel}
        onResultClick={handleResultClick}
      />

      <ResultSheet selectedResult={selectedResult} onClose={() => setSelectedResult(null)} />
    </div>
  )
}
