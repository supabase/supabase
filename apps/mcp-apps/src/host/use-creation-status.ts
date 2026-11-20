import { useEffect, useState, useSyncExternalStore } from 'react'
import { errorMessage, useAnnouncement } from 'surfaces/common'
import {
  creationStatus,
  isCreationSettled,
  type CreationCall,
  type CreationCheck,
  type CreationProgress,
} from 'surfaces/project'

import type { ToolCallStore } from './tool-call-store'
import { usePoll } from './use-poll'

/** The tool call a view was opened for, as it changes. */
export function useToolCall<T>(store: ToolCallStore<T>) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

/**
 * Follows what a tool call created (a project, a branch) until it's ready,
 * and says how `ProjectCard` should show it: the status badge, a note for a
 * problem or for why the status won't update, and Retry once checking has
 * stopped without an answer. Changes are announced to screen readers.
 */
export function useCreationStatus<T extends { status: string }>({
  noun,
  call,
  canCheck,
  read,
  steps,
  progress,
  checkWith,
  intervalMs,
}: {
  /** What is being created, for announcements: "project" or "branch". */
  noun: string
  call: CreationCall<T>
  /** False when the status can't be read, e.g. the host can't proxy tool calls. */
  canCheck: boolean
  /** Reads the latest version of what the tool call returned. */
  read: (created: T) => Promise<T>
  /** The steps of creating it; `progress` returns indexes into these. */
  steps: string[]
  progress: (status: string) => CreationProgress
  /** Tool the model can use to check the status when the view can't. */
  checkWith: string
  intervalMs?: number
}) {
  const created = call.status === 'ready' ? call.data : undefined

  // Bumped by a successful Retry to resume polling that stopped.
  const [pollSession, setPollSession] = useState(0)
  const poll = usePoll<T>({
    enabled: canCheck && !!created,
    fetcher: () => read(created!),
    isTerminal: (data) => isCreationSettled(progress(data.status)),
    restartKey: pollSession,
    intervalMs,
  })

  // The newest read, from polling or from Retry.
  const [latest, setLatest] = useState<T>()
  useEffect(() => {
    if (poll.data) setLatest(poll.data)
  }, [poll.data])
  const data = latest ?? created

  // Retry reads the status now and, if that works, starts checking again.
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string>()
  async function retry() {
    if (!created) return
    setIsRetrying(true)
    try {
      setLatest(await read(created))
      setRetryError(undefined)
      // Restarting polling also clears its error.
      setPollSession((session) => session + 1)
    } catch (error) {
      setRetryError(errorMessage(error))
    } finally {
      setIsRetrying(false)
    }
  }

  let check: CreationCheck = { status: 'checking' }
  if (retryError) check = { status: 'failed', message: retryError }
  else if (poll.status === 'error') check = { status: 'failed', message: poll.error.message }
  else if (poll.status === 'timeout') check = { status: 'stopped' }
  else if (poll.status === 'done') check = { status: 'settled' }

  const { announcement, alert, canRetry, ...status } = creationStatus({
    noun,
    call,
    status: data?.status,
    progress: data ? progress(data.status) : undefined,
    steps,
    check,
    canCheck,
    checkWith,
  })

  useAnnouncement(announcement)
  useAnnouncement(alert, 'assertive')

  return {
    /** The latest read, or what the tool call returned until there is one. */
    data,
    ...status,
    onRetry: canRetry ? () => void retry() : undefined,
    isRetrying,
  }
}
