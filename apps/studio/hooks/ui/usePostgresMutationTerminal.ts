'use client'

import { useState, useCallback } from 'react'

// Animation duration from PostgresMutationTerminal component
const TERMINAL_ANIMATION_DURATION_MS = 200

export interface TerminalRow {
  id: number
  message: string
  status: 'pending' | 'complete' | 'error' | 'success'
  timestamp: number
  timeTaken?: number
  errorDetails?: string
}

export type AddStepFunction = ((message: string) => number) & {
  success: (message: string) => number
  error: (message: string, errorDetails?: string) => number
}

export function usePostgresMutationTerminal() {
  const [isOpen, setIsOpen] = useState(false)
  const [steps, setSteps] = useState<TerminalRow[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null)

  // Start the terminal process
  const terminalStart = useCallback(() => {
    const now = Date.now()
    setStartTimestamp(now)
    setIsOpen(true)
    setIsRunning(true)
  }, [])

  // Open the terminal without starting the process
  const terminalOpen = useCallback((onAfterOpen?: () => void) => {
    setIsOpen(true)
    // If callback is provided, call it after the terminal animation completes
    if (onAfterOpen) {
      setTimeout(
        () => {
          onAfterOpen()
        },
        TERMINAL_ANIMATION_DURATION_MS +
          // add abritary time buffer
          50
      )
    }
  }, [])

  // Stop the terminal process
  const terminalStop = useCallback(() => {
    setIsRunning(false)
  }, [])

  // Core function to add a step with any status
  const internalAddStep = useCallback(
    (
      message: string,
      status: 'pending' | 'complete' | 'error' | 'success',
      errorDetails?: string
    ) => {
      const now = Date.now()

      setSteps((currentSteps) => {
        // Calculate time taken
        let timeTaken: number | undefined

        if (currentSteps.length === 0) {
          timeTaken = startTimestamp ? now - startTimestamp : undefined
        } else {
          const lastStep = currentSteps[currentSteps.length - 1]
          timeTaken = now - lastStep.timestamp
        }

        const newStep: TerminalRow = {
          id: currentSteps.length + 1,
          message,
          status,
          timestamp: now,
          timeTaken,
          ...(errorDetails && { errorDetails }),
        }

        return [...currentSteps, newStep]
      })

      // Auto-open the terminal when adding the first step
      if (!isOpen) {
        setIsOpen(true)
        setIsRunning(true)
        setStartTimestamp(now)
      }

      // Stop running on error
      if (status === 'error') {
        setIsRunning(false)
      }

      return steps.length + 1 // Return the new step count
    },
    [steps.length, isOpen, startTimestamp]
  )

  // Create the base addStep function
  const addStep = useCallback(
    (message: string) => internalAddStep(message, 'complete'),
    [internalAddStep]
  ) as AddStepFunction

  // Add the success and error methods
  addStep.success = useCallback(
    (message: string) => internalAddStep(message, 'success'),
    [internalAddStep]
  )

  addStep.error = useCallback(
    (message: string, errorDetails?: string) => internalAddStep(message, 'error', errorDetails),
    [internalAddStep]
  )

  // Clear all steps
  const clearSteps = useCallback(() => {
    setSteps([])
    setStartTimestamp(null)
  }, [])

  // Reset terminal - clear steps but keep terminal open
  const terminalReset = useCallback(() => {
    setSteps([])
    setStartTimestamp(null)
    setIsRunning(false)
    // Don't close the terminal - keep it open
  }, [])

  // Close the terminal
  const closeTerminal = useCallback(() => {
    setIsOpen(false)
    setIsRunning(false)
  }, [])

  // Close the terminal (alias for closeTerminal)
  const terminalClose = useCallback(() => {
    setIsOpen(false)
    setIsRunning(false)
  }, [])

  return {
    isOpen,
    steps,
    isRunning,
    terminalStart,
    terminalOpen,
    terminalStop,
    addStep,
    clearSteps,
    terminalReset,
    closeTerminal,
    terminalClose,
  }
}
