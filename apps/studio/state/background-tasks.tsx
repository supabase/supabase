import { PropsWithChildren, createContext, useContext, useEffect } from 'react'
import { proxy, useSnapshot } from 'valtio'

import { useConstant } from 'common'

export type BackgroundTaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export type BackgroundTask<TMetadata = Record<string, any>> = {
  id: string
  type: string
  status: BackgroundTaskStatus
  metadata: TMetadata
  execute: () => Promise<void>
  createdAt: number
}

const createBackgroundTasksState = () => {
  const state = proxy({
    tasks: [] as BackgroundTask[],

    addTask: <TMetadata = Record<string, any>,>(
      task: Omit<BackgroundTask<TMetadata>, 'status' | 'createdAt'>
    ) => {
      const newTask: BackgroundTask<TMetadata> = {
        ...task,
        status: 'pending',
        createdAt: Date.now(),
      }
      state.tasks.push(newTask)
      return newTask.id
    },

    removeTask: (id: string) => {
      const index = state.tasks.findIndex((t) => t.id === id)
      if (index !== -1) {
        state.tasks.splice(index, 1)
      }
    },

    updateTaskStatus: (id: string, status: BackgroundTaskStatus) => {
      const task = state.tasks.find((t) => t.id === id)
      if (task) {
        task.status = status
      }
    },

    get pendingTasks() {
      return state.tasks.filter((t) => t.status === 'pending')
    },

    get runningTasks() {
      return state.tasks.filter((t) => t.status === 'running')
    },
  })

  return state
}

export type BackgroundTasksState = ReturnType<typeof createBackgroundTasksState>

export const BackgroundTasksStateContext = createContext<BackgroundTasksState>(
  createBackgroundTasksState()
)

export const BackgroundTasksStateContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const state = useConstant(createBackgroundTasksState)

  // Process tasks sequentially
  useEffect(() => {
    let isProcessing = false
    let timeoutId: NodeJS.Timeout | null = null

    const processNextTask = async () => {
      if (isProcessing) return

      const pendingTask = state.tasks.find((t) => t.status === 'pending')
      if (!pendingTask) return

      isProcessing = true
      state.updateTaskStatus(pendingTask.id, 'running')

      try {
        await pendingTask.execute()
        state.updateTaskStatus(pendingTask.id, 'completed')
        // Remove completed tasks after a short delay to allow UI to update
        setTimeout(() => {
          state.removeTask(pendingTask.id)
        }, 1000)
      } catch (error) {
        console.error(`Background task ${pendingTask.id} failed:`, error)
        state.updateTaskStatus(pendingTask.id, 'failed')
        // Remove failed tasks after a delay
        setTimeout(() => {
          state.removeTask(pendingTask.id)
        }, 5000)
      } finally {
        isProcessing = false
        // Process next task if available
        timeoutId = setTimeout(() => processNextTask(), 100)
      }
    }

    // Check for pending tasks periodically and trigger immediately
    const checkAndProcess = () => {
      if (!isProcessing && state.tasks.some((t) => t.status === 'pending')) {
        processNextTask()
      }
    }

    // Initial check
    checkAndProcess()

    // Check periodically
    const interval = setInterval(checkAndProcess, 500)

    return () => {
      clearInterval(interval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [state])

  return (
    <BackgroundTasksStateContext.Provider value={state}>
      {children}
    </BackgroundTasksStateContext.Provider>
  )
}

export const useBackgroundTasksStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(BackgroundTasksStateContext)
  return useSnapshot(state, options)
}

export const useBackgroundTasksState = () => {
  return useContext(BackgroundTasksStateContext)
}
