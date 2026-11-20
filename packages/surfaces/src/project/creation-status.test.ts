import { describe, expect, it } from 'vitest'

import {
  BRANCH_CREATION_STEPS,
  branchCreationProgress,
  creationStatus,
  PROJECT_CREATION_STEPS,
  projectCreationProgress,
  type CreationCall,
  type CreationCheck,
} from './creation-status'

describe('projectCreationProgress', () => {
  it('follows a new project through its steps', () => {
    expect(projectCreationProgress('COMING_UP')).toEqual({ state: 'step', step: 1 })
    expect(projectCreationProgress('UNKNOWN')).toEqual({ state: 'step', step: 1 })
    // Left COMING_UP but not healthy yet.
    expect(projectCreationProgress('ACTIVE_UNHEALTHY')).toEqual({ state: 'step', step: 2 })
    expect(projectCreationProgress('ACTIVE_HEALTHY')).toEqual({ state: 'done' })
  })

  it('treats failures and removal as failed', () => {
    expect(projectCreationProgress('INIT_FAILED')).toEqual({ state: 'failed', step: 1 })
    expect(projectCreationProgress('REMOVED')).toEqual({ state: 'failed', step: 1 })
  })

  it('labels statuses outside creation as Studio does, neutral while they change', () => {
    expect(projectCreationProgress('INACTIVE')).toEqual({
      state: 'other',
      label: 'Paused',
      tone: undefined,
      isChanging: false,
    })
    expect(projectCreationProgress('RESTORING')).toEqual({
      state: 'other',
      label: 'Restoring',
      tone: undefined,
      isChanging: true,
    })
  })
})

describe('branchCreationProgress', () => {
  it('follows a new branch through its steps', () => {
    expect(branchCreationProgress('CREATING_PROJECT')).toEqual({ state: 'step', step: 1 })
    expect(branchCreationProgress('RUNNING_MIGRATIONS')).toEqual({ state: 'step', step: 2 })
    expect(branchCreationProgress('MIGRATIONS_PASSED')).toEqual({ state: 'step', step: 3 })
    expect(branchCreationProgress('FUNCTIONS_DEPLOYED')).toEqual({ state: 'done' })
  })

  it('says which step failed', () => {
    expect(branchCreationProgress('MIGRATIONS_FAILED')).toEqual({ state: 'failed', step: 2 })
    expect(branchCreationProgress('FUNCTIONS_FAILED')).toEqual({ state: 'failed', step: 3 })
  })

  it('treats an unknown status as the first step', () => {
    expect(branchCreationProgress('SOMETHING_NEW')).toEqual({ state: 'step', step: 1 })
  })
})

function projectStatus({
  call = { status: 'ready', data: {} },
  status = 'COMING_UP',
  check = { status: 'checking' },
  canCheck = true,
}: {
  call?: CreationCall<unknown>
  status?: string
  check?: CreationCheck
  canCheck?: boolean
} = {}) {
  const isReady = call.status === 'ready'
  return creationStatus({
    noun: 'project',
    call,
    status: isReady ? status : undefined,
    progress: isReady ? projectCreationProgress(status) : undefined,
    steps: PROJECT_CREATION_STEPS,
    check,
    canCheck,
    checkWith: 'get_project',
  })
}

describe('creationStatus', () => {
  it('has nothing to show but skeletons before the request returns', () => {
    const status = projectStatus({ call: { status: 'loading' } })
    expect(status).toMatchObject({ isLoading: true, isDone: false, canRetry: false })
    expect(status.badge).toBeUndefined()
    expect(status.announcement).toBe('Loading project')
  })

  it('names the step, neutral and spinning while the host follows it', () => {
    const status = projectStatus({ status: 'ACTIVE_UNHEALTHY' })
    expect(status.badge).toEqual({ label: 'Checking health', isSpinning: true })
    expect(status.announcement).toBe('Checking health, step 3 of 3')
  })

  it('is Active once done', () => {
    const status = projectStatus({ status: 'ACTIVE_HEALTHY', check: { status: 'settled' } })
    expect(status.badge).toEqual({ label: 'Active', tone: 'success' })
    expect(status.isDone).toBe(true)
  })

  it('says which step failed, and that it is final', () => {
    const status = creationStatus({
      noun: 'branch',
      call: { status: 'ready', data: {} },
      status: 'MIGRATIONS_FAILED',
      progress: branchCreationProgress('MIGRATIONS_FAILED'),
      steps: BRANCH_CREATION_STEPS,
      check: { status: 'settled' },
      canCheck: true,
      checkWith: 'list_branches',
    })
    expect(status.badge).toEqual({ label: 'Failed', tone: 'danger' })
    expect(status.note?.text).toBe('Failed while running migrations (MIGRATIONS_FAILED).')
    expect(status.alert).toBe(status.note?.text)
    expect(status.canRetry).toBe(false)
  })

  it('shows a request that failed, with its message', () => {
    const status = projectStatus({ call: { status: 'error', message: 'Project limit reached' } })
    expect(status.badge).toEqual({ label: 'Failed', tone: 'danger' })
    expect(status.note).toEqual({ tone: 'danger', text: 'Project limit reached' })
    expect(status.isLoading).toBe(false)
  })

  it('shows a cancelled request, with the reason when there is one', () => {
    expect(projectStatus({ call: { status: 'cancelled' } })).toMatchObject({
      badge: { label: 'Cancelled' },
      note: undefined,
      announcement: 'Cancelled',
    })
    expect(projectStatus({ call: { status: 'cancelled', reason: 'user action' } })).toMatchObject({
      note: { tone: 'muted', text: 'user action' },
      announcement: 'Cancelled. user action',
    })
  })

  it('replaces the status with a failed check, and offers Retry', () => {
    const status = projectStatus({ check: { status: 'failed', message: 'Network error' } })
    // The last status read may no longer be true, so it is not shown.
    expect(status.badge).toMatchObject({ label: 'Check failed', tone: 'danger' })
    expect(status.note?.text).toBe("Can't check status: Network error.")
    expect(status.canRetry).toBe(true)
  })

  it('says when checking stopped, and offers Retry', () => {
    const status = projectStatus({ check: { status: 'stopped' } })
    expect(status.badge).toEqual({ label: 'Creating', isSpinning: false })
    expect(status.note).toEqual({ tone: 'muted', text: 'Stopped checking after 10 minutes.' })
    expect(status.canRetry).toBe(true)
  })

  it('points to the agent when the host cannot check the status', () => {
    const status = projectStatus({ canCheck: false })
    expect(status.badge).toEqual({ label: 'Creating', isSpinning: false })
    expect(status.note?.text).toBe(
      "Status won't update here. Ask the assistant to check with get_project."
    )
    expect(status.canRetry).toBe(false)
  })
})
