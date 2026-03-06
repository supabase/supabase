/**
 * Flow Engine Hook
 *
 * Manages the state and navigation of the Database Planner wizard.
 * Powers the interactive UI from the parsed Mermaid diagram.
 */

import { useCallback, useMemo, useState } from 'react'
import { parseMermaidFlow, getNextOptions, isTerminalNode } from './mermaid-parser'
import type { FlowNode, FlowState, ParsedFlow } from './types'
import {
  MERMAID_DIAGRAM,
  SOLUTION_DETAILS,
  SYMPTOM_DETAILS,
  DIAGNOSTIC_DETAILS,
  type SolutionDetails,
  type SymptomDetails,
  type DiagnosticDetails,
} from '~/data/planner-flow'

export interface PlannerFlowHook {
  state: FlowState
  /** Current node details */
  currentNode: FlowNode | null
  /** Available symptoms to start from */
  symptoms: Array<FlowNode & { details: SymptomDetails }>
  /** Available options from current node */
  options: Array<{ label: string; nodeId: string; isDotted: boolean }>
  /** Whether current node is a solution */
  isSolution: boolean
  /** Solution details if at a solution node */
  solutionDetails: SolutionDetails | null
  /** Diagnostic details if at a diagnostic node */
  diagnosticDetails: DiagnosticDetails | null
  /** Path history with node details */
  pathHistory: Array<{ node: FlowNode; choiceLabel?: string }>
  /** Progress percentage (0-100) */
  progress: number
  /** Select a symptom to start */
  selectSymptom: (symptomId: string) => void
  /** Select an option to navigate */
  selectOption: (nodeId: string, choiceLabel?: string) => void
  /** Go back one step */
  goBack: () => void
  /** Reset to beginning */
  reset: () => void
  /** Related solutions (from dotted lines) */
  relatedSolutions: Array<{ node: FlowNode; details: SolutionDetails; label?: string }>
}

export function usePlannerFlow(): PlannerFlowHook {
  const flow = useMemo(() => parseMermaidFlow(MERMAID_DIAGRAM), [])
  const [state, setState] = useState<FlowState>({
    path: [],
    currentNodeId: null,
    isComplete: false,
  })
  const [choiceLabels, setChoiceLabels] = useState<Map<number, string>>(new Map())

  const currentNode = useMemo(
    () => (state.currentNodeId ? flow.nodes.get(state.currentNodeId) || null : null),
    [flow, state.currentNodeId]
  )

  const symptoms = useMemo(
    () =>
      flow.symptoms.map((s) => ({
        ...s,
        details: SYMPTOM_DETAILS[s.id] || {
          title: s.label,
          description: '',
          icon: 'slow' as const,
        },
      })),
    [flow]
  )

  const options = useMemo(
    () => (state.currentNodeId ? getNextOptions(state.currentNodeId, flow) : []),
    [flow, state.currentNodeId]
  )

  const isSolution = useMemo(
    () => (state.currentNodeId ? isTerminalNode(state.currentNodeId, flow) : false),
    [flow, state.currentNodeId]
  )

  const solutionDetails = useMemo(
    () =>
      currentNode && (currentNode.type === 'solution' || currentNode.type === 'future')
        ? SOLUTION_DETAILS[currentNode.id] || null
        : null,
    [currentNode]
  )

  const diagnosticDetails = useMemo(
    () =>
      currentNode && currentNode.type === 'diagnostic'
        ? DIAGNOSTIC_DETAILS[currentNode.id] || null
        : null,
    [currentNode]
  )

  const pathHistory = useMemo(() => {
    return state.path.map((nodeId, index) => {
      const node = flow.nodes.get(nodeId)
      return {
        node: node || { id: nodeId, label: nodeId, type: 'symptom' as const },
        choiceLabel: choiceLabels.get(index),
      }
    })
  }, [flow, state.path, choiceLabels])

  const progress = useMemo(() => {
    if (state.path.length === 0) return 0
    if (isSolution) return 100
    const estimatedSteps = 4
    return Math.min(90, Math.round((state.path.length / estimatedSteps) * 100))
  }, [state.path, isSolution])

  const relatedSolutions = useMemo(() => {
    if (!state.currentNodeId) return []

    const related: Array<{ node: FlowNode; details: SolutionDetails; label?: string }> = []
    for (const edge of flow.edges) {
      if (edge.from === state.currentNodeId && edge.isDotted) {
        const targetNode = flow.nodes.get(edge.to)
        const details = SOLUTION_DETAILS[edge.to]
        if (targetNode && details) {
          related.push({ node: targetNode, details, label: edge.label })
        }
      }
    }
    return related
  }, [flow, state.currentNodeId])

  /**
   * Auto-navigate through single-option paths to the next real decision point.
   * This skips intermediate nodes that only have one option.
   */
  const findDecisionPoint = useCallback(
    (startNodeId: string, path: string[]): { nodeId: string; path: string[] } => {
      let currentId = startNodeId
      let currentPath = [...path]

      while (true) {
        const nextOpts = getNextOptions(currentId, flow).filter((o) => !o.isDotted)
        if (nextOpts.length !== 1) break

        const nextId = nextOpts[0].nodeId
        currentPath.push(nextId)
        currentId = nextId

        const node = flow.nodes.get(nextId)
        if (node?.type === 'solution' || node?.type === 'future') break
      }

      return { nodeId: currentId, path: currentPath }
    },
    [flow]
  )

  const selectSymptom = useCallback(
    (symptomId: string) => {
      setChoiceLabels(new Map())
      const { nodeId, path } = findDecisionPoint(symptomId, [symptomId])
      const node = flow.nodes.get(nodeId)
      const isComplete =
        node?.type === 'solution' || node?.type === 'future' || isTerminalNode(nodeId, flow)

      setState({ path, currentNodeId: nodeId, isComplete })
    },
    [flow, findDecisionPoint]
  )

  const selectOption = useCallback(
    (nodeId: string, choiceLabel?: string) => {
      if (choiceLabel) {
        setChoiceLabels((prev) => {
          const next = new Map(prev)
          next.set(state.path.length, choiceLabel)
          return next
        })
      }

      const { nodeId: finalNodeId, path: additionalPath } = findDecisionPoint(nodeId, [nodeId])

      setState((prev) => {
        const newPath = [...prev.path, ...additionalPath]
        const node = flow.nodes.get(finalNodeId)
        const isComplete =
          node?.type === 'solution' || node?.type === 'future' || isTerminalNode(finalNodeId, flow)

        return {
          path: newPath,
          currentNodeId: finalNodeId,
          isComplete,
        }
      })
    },
    [flow, state.path.length, findDecisionPoint]
  )

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.path.length <= 1) {
        return { path: [], currentNodeId: null, isComplete: false }
      }

      const newPath = prev.path.slice(0, -1)
      return {
        path: newPath,
        currentNodeId: newPath[newPath.length - 1],
        isComplete: false,
      }
    })

    setChoiceLabels((prev) => {
      const next = new Map(prev)
      next.delete(state.path.length - 1)
      return next
    })
  }, [state.path.length])

  const reset = useCallback(() => {
    setChoiceLabels(new Map())
    setState({
      path: [],
      currentNodeId: null,
      isComplete: false,
    })
  }, [])

  return {
    state,
    currentNode,
    symptoms,
    options,
    isSolution,
    solutionDetails,
    diagnosticDetails,
    pathHistory,
    progress,
    selectSymptom,
    selectOption,
    goBack,
    reset,
    relatedSolutions,
  }
}
