import type { ProjectCardBadge, ProjectCardNote } from './project-card'
import { isProjectChanging, projectStatusBadge } from './project-status'

/**
 * How a `ProjectCard` shows something that is being created (a project, a
 * branch), from the request that creates it and what the host has read since.
 * Hosts follow the status themselves; nothing here fetches.
 */

/**
 * The request that creates it. In MCP Apps hosts this is the tool call the
 * card was opened for: it may still be waiting on the user, or be cancelled.
 */
export type CreationCall<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'cancelled'; reason?: string }
  /** The request returned an error, or its result couldn't be read. */
  | { status: 'error'; message: string }

/** Where the thing being created is, for one of its statuses. */
export type CreationProgress =
  | { state: 'done' }
  /** On, or failed at, this index of its steps. */
  | { state: 'step' | 'failed'; step: number }
  /** A status outside creation (paused, restarting, …), with its own label. */
  | {
      state: 'other'
      label: string
      tone?: 'success' | 'warning'
      /** Whether it moves on by itself, so a host keeps checking it. */
      isChanging: boolean
    }

/** Whether a host has finished following: ready, or failed for good. */
export function isCreationSettled(progress: CreationProgress) {
  return progress.state === 'done' || progress.state === 'failed'
}

/**
 * The steps of creating a project. The Management API reports only the
 * project's status, so the step is inferred from it. The first is the create
 * request itself, done by the time there is a project.
 */
export const PROJECT_CREATION_STEPS = ['Creating project', 'Creating', 'Checking health']

const isFailed = (status: string) => status === 'REMOVED' || status.endsWith('_FAILED')

/** Where a new project is, for a Management API project status. */
export function projectCreationProgress(status: string): CreationProgress {
  if (status === 'ACTIVE_HEALTHY') return { state: 'done' }
  // The API doesn't say which step failed.
  if (isFailed(status)) return { state: 'failed', step: 1 }
  if (status === 'COMING_UP' || status === 'UNKNOWN') return { state: 'step', step: 1 }
  // Left COMING_UP but not healthy yet.
  if (status === 'ACTIVE_UNHEALTHY') return { state: 'step', step: 2 }

  // A status a new project shouldn't reach (paused, restarting, …), with
  // Studio's label. Ones still in progress are neutral, like the steps.
  const { label, variant } = projectStatusBadge(status)
  const isChanging = isProjectChanging(status)
  return {
    state: 'other',
    label,
    tone: isChanging || variant === 'default' ? undefined : variant,
    isChanging,
  }
}

/**
 * The steps of creating a branch. The first is the create request itself,
 * done by the time there is a branch.
 */
export const BRANCH_CREATION_STEPS = [
  'Creating branch',
  'Creating',
  'Running migrations',
  'Deploying functions',
]

/** Where a new branch is, per branch status. */
export function branchCreationProgress(status: string): CreationProgress {
  switch (status) {
    case 'FUNCTIONS_DEPLOYED':
      return { state: 'done' }
    case 'MIGRATIONS_PASSED':
      return { state: 'step', step: 3 }
    case 'RUNNING_MIGRATIONS':
      return { state: 'step', step: 2 }
    case 'MIGRATIONS_FAILED':
      return { state: 'failed', step: 2 }
    case 'FUNCTIONS_FAILED':
      return { state: 'failed', step: 3 }
    default:
      // CREATING_PROJECT (provisioning the branch's database), and anything
      // newer than this view.
      return { state: 'step', step: 1 }
  }
}

/**
 * Where a host's status checks are. `stopped` and `failed` both mean it is no
 * longer checking: it ran out of time, or the checks kept failing.
 */
export type CreationCheck =
  | { status: 'checking' }
  | { status: 'settled' }
  | { status: 'stopped' }
  | { status: 'failed'; message: string }

export interface CreationStatus {
  badge?: ProjectCardBadge
  note?: ProjectCardNote
  /** What screen readers should hear when it changes, politely. */
  announcement: string
  /** A problem screen readers should hear at once. */
  alert?: string
  isLoading: boolean
  isDone: boolean
  /** Checking stopped without an answer and can start again. */
  canRetry: boolean
}

export function creationStatus({
  noun,
  call,
  status,
  progress,
  steps,
  check,
  canCheck,
  checkWith,
}: {
  /** What is being created, for announcements: "project" or "branch". */
  noun: string
  call: CreationCall<unknown>
  /** The latest status read, or the one the request returned. */
  status: string | undefined
  /** Where that status is in `steps`. */
  progress: CreationProgress | undefined
  /** The steps of creating it; `progress` holds indexes into these. */
  steps: string[]
  check: CreationCheck
  /** False when the host can't read the status, so the card won't update. */
  canCheck: boolean
  /** What the agent can use to check the status when the host can't, e.g. a tool name. */
  checkWith: string
}): CreationStatus {
  const isFollowing = canCheck && check.status === 'checking'
  const isChanging =
    progress?.state === 'step' || (progress?.state === 'other' && progress.isChanging)
  // No result yet (the host may still be asking the user to confirm): the card
  // shows what was asked for, if known, and skeletons for the rest.
  const isLoading = call.status === 'loading'

  let badge: ProjectCardBadge | undefined
  let note: ProjectCardNote | undefined
  let announcement: string
  if (isLoading) {
    announcement = `Loading ${noun}`
  } else if (call.status === 'error') {
    badge = { label: 'Failed', tone: 'danger' }
    note = { tone: 'danger', text: call.message }
    announcement = 'Failed'
  } else if (call.status === 'cancelled') {
    badge = { label: 'Cancelled' }
    note = call.reason ? { tone: 'muted', text: call.reason } : undefined
    announcement = 'Cancelled'
  } else if (check.status === 'failed') {
    // A failed check replaces the status: the last one read may no longer be true.
    badge = {
      label: 'Check failed',
      tone: 'danger',
      title: `Failed to check status: ${check.message}`,
    }
    note = { tone: 'danger', text: `Can't check status: ${check.message}.` }
    announcement = 'Check failed'
  } else if (progress?.state === 'done') {
    badge = { label: 'Active', tone: 'success' }
    announcement = 'Active'
  } else if (progress?.state === 'failed') {
    badge = { label: 'Failed', tone: 'danger' }
    note = {
      tone: 'danger',
      text: `Failed while ${steps[progress.step]!.toLowerCase()} (${status}).`,
    }
    announcement = 'Failed'
  } else if (progress?.state === 'step') {
    // Neutral, with the spinner saying it's in progress: hosts' warning
    // colours vary and read as a problem.
    const label = steps[progress.step]!
    badge = { label, isSpinning: isFollowing }
    announcement = `${label}, step ${progress.step + 1} of ${steps.length}`
  } else if (progress?.state === 'other') {
    badge = {
      label: progress.label,
      tone: progress.tone,
      isSpinning: progress.isChanging && isFollowing,
    }
    announcement = progress.label
  } else {
    announcement = `Loading ${noun}`
  }

  if (call.status === 'ready' && !note) {
    if (check.status === 'stopped') {
      note = { tone: 'muted', text: 'Stopped checking after 10 minutes.' }
    } else if (!canCheck && isChanging) {
      note = {
        tone: 'muted',
        text: `Status won't update here. Ask the assistant to check with ${checkWith}.`,
      }
    }
  }

  return {
    badge,
    note,
    // Muted notes are heard with the status; danger notes interrupt on their own.
    announcement: note?.tone === 'muted' ? `${announcement}. ${note.text}` : announcement,
    alert: note?.tone === 'danger' ? note.text : undefined,
    isLoading,
    isDone: progress?.state === 'done' && call.status === 'ready',
    canRetry:
      call.status === 'ready' &&
      canCheck &&
      (check.status === 'failed' || check.status === 'stopped'),
  }
}
