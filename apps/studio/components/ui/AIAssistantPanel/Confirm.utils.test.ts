import { describe, expect, it, vi } from 'vitest'

import {
  getConfirmFooterBar,
  getManualToolApprovalConfirmState,
  getManualToolApprovalHandlers,
  getManualToolApprovalId,
  USER_SKIPPED_TOOL_REASON,
} from './Confirm.utils'

describe('getConfirmFooterBar', () => {
  it('hides the bar when no approval state is provided', () => {
    expect(getConfirmFooterBar()).toEqual({ show: false, isLoading: false })
  })

  it('shows the bar while approval is requested', () => {
    expect(getConfirmFooterBar('approval-requested')).toEqual({ show: true, isLoading: false })
  })

  it('shows a loading bar after the user approves', () => {
    expect(getConfirmFooterBar('approval-responded')).toEqual({ show: true, isLoading: true })
  })

  it('shows a terminal outcome after a completed approval', () => {
    expect(getConfirmFooterBar('success')).toEqual({
      show: true,
      isLoading: false,
      outcome: 'success',
    })
    expect(getConfirmFooterBar('error')).toEqual({
      show: true,
      isLoading: false,
      outcome: 'error',
    })
    expect(getConfirmFooterBar('denied')).toEqual({
      show: true,
      isLoading: false,
      outcome: 'denied',
    })
  })
})

describe('getManualToolApprovalConfirmState', () => {
  it('shows an interactive footer for a manual approval request', () => {
    expect(
      getManualToolApprovalConfirmState({
        state: 'approval-requested',
        approval: { id: 'approval-1' },
      })
    ).toBe('approval-requested')
  })

  it('keeps a loading footer after a manual approve', () => {
    expect(
      getManualToolApprovalConfirmState({
        state: 'approval-responded',
        approval: { id: 'approval-1', approved: true },
      })
    ).toBe('approval-responded')
  })

  it('keeps a terminal footer after a manual tool completes', () => {
    expect(
      getManualToolApprovalConfirmState({
        state: 'output-available',
        approval: { id: 'approval-1', approved: true },
      })
    ).toBe('success')
    expect(
      getManualToolApprovalConfirmState({
        state: 'output-error',
        approval: { id: 'approval-1', approved: true },
      })
    ).toBe('error')
    expect(
      getManualToolApprovalConfirmState({
        state: 'output-denied',
        approval: { id: 'approval-1', approved: false },
      })
    ).toBe('denied')
  })

  it('hides the footer for automatic approvals', () => {
    expect(
      getManualToolApprovalConfirmState({
        state: 'approval-requested',
        approval: { id: 'approval-1', isAutomatic: true },
      })
    ).toBeUndefined()
    expect(
      getManualToolApprovalConfirmState({
        state: 'approval-responded',
        approval: { id: 'approval-1', approved: true, isAutomatic: true },
      })
    ).toBeUndefined()
  })

  it('hides the footer when the user denied the request', () => {
    expect(
      getManualToolApprovalConfirmState({
        state: 'approval-responded',
        approval: { id: 'approval-1', approved: false },
      })
    ).toBeUndefined()
  })

  it('ignores terminal states that were not manually approved', () => {
    expect(getManualToolApprovalConfirmState({ state: 'input-available' })).toBeUndefined()
    expect(getManualToolApprovalConfirmState({ state: 'output-available' })).toBeUndefined()
    expect(getManualToolApprovalConfirmState({ state: 'output-error' })).toBeUndefined()
    expect(getManualToolApprovalConfirmState({ state: 'output-denied' })).toBeUndefined()
  })
})

describe('getManualToolApprovalId', () => {
  it('returns the approval id only for a manual approval-requested part', () => {
    expect(
      getManualToolApprovalId({ state: 'approval-requested', approval: { id: 'approval-1' } })
    ).toBe('approval-1')
    expect(
      getManualToolApprovalId({
        state: 'approval-requested',
        approval: { id: 'approval-1', isAutomatic: true },
      })
    ).toBeUndefined()
    expect(
      getManualToolApprovalId({
        state: 'approval-responded',
        approval: { id: 'approval-1', approved: true },
      })
    ).toBeUndefined()
  })
})

describe('getManualToolApprovalHandlers', () => {
  it('wires approve and deny only while a manual approval is requested', () => {
    const addToolApprovalResponse = vi.fn()
    const { confirmState, onApprove, onDeny } = getManualToolApprovalHandlers({
      state: 'approval-requested',
      approval: { id: 'approval-1' },
      addToolApprovalResponse,
    })

    expect(confirmState).toBe('approval-requested')
    onApprove?.()
    onDeny?.()
    expect(addToolApprovalResponse).toHaveBeenCalledWith({ id: 'approval-1', approved: true })
    expect(addToolApprovalResponse).toHaveBeenCalledWith({
      id: 'approval-1',
      approved: false,
      reason: USER_SKIPPED_TOOL_REASON,
    })
  })

  it('does not call addToolApprovalResponse for automatic approvals', () => {
    const addToolApprovalResponse = vi.fn()
    const handlers = getManualToolApprovalHandlers({
      state: 'approval-requested',
      approval: { id: 'approval-1', isAutomatic: true },
      addToolApprovalResponse,
    })

    expect(handlers).toEqual({ confirmState: undefined })
    expect(addToolApprovalResponse).not.toHaveBeenCalled()
  })
})
