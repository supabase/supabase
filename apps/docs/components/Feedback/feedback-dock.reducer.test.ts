import { describe, expect, it } from 'vitest'

import {
  feedbackDockReducer,
  INITIAL_FEEDBACK_DOCK_STATE,
  type FeedbackDockAction,
  type FeedbackDockState,
} from './feedback-dock.reducer'

const PAGE_A = { pathname: '/guides/auth' }
const PAGE_B = { pathname: '/guides/storage' }
const START: FeedbackDockAction = { type: 'submitStarted', query: { language: 'js' } }
const INSERT_FAILED = { kind: 'insert_failed', isOffline: false } as const

const reduce = (state: FeedbackDockState, ...actions: FeedbackDockAction[]) =>
  actions.reduce(feedbackDockReducer, state)

const openWithDraft = () =>
  reduce(
    INITIAL_FEEDBACK_DOCK_STATE,
    { type: 'openDock', vote: 'no', page: PAGE_A },
    { type: 'setComment', comment: 'Broken link' }
  )

describe('feedbackDockReducer', () => {
  it('opens on the voted page with an empty draft', () => {
    const state = reduce(INITIAL_FEEDBACK_DOCK_STATE, {
      type: 'openDock',
      vote: 'no',
      page: PAGE_A,
    })

    expect(state).toMatchObject({
      isOpen: true,
      vote: 'no',
      targetPage: PAGE_A,
      draft: { comment: '' },
    })
  })

  it('switches the vote or retargets another page and keeps the draft', () => {
    expect(reduce(openWithDraft(), { type: 'openDock', vote: 'yes', page: PAGE_A })).toMatchObject({
      vote: 'yes',
      draft: { comment: 'Broken link' },
    })
    expect(reduce(openWithDraft(), { type: 'openDock', vote: 'no', page: PAGE_B })).toMatchObject({
      targetPage: PAGE_B,
      draft: { comment: 'Broken link' },
    })
  })

  it('keeps the vote and page locked while sending and once the comment row is saved', () => {
    const sending = reduce(openWithDraft(), START)
    expect(reduce(sending, { type: 'openDock', vote: 'yes', page: PAGE_A })).toBe(sending)

    const saved = reduce(
      sending,
      { type: 'commentSaved', submissionId: 1 },
      { type: 'submitFailed', submissionId: 1, error: INSERT_FAILED }
    )
    expect(reduce(saved, { type: 'openDock', vote: 'yes', page: PAGE_B })).toBe(saved)
  })

  it('closes and clears the draft', () => {
    expect(reduce(openWithDraft(), { type: 'closeDock' })).toEqual(INITIAL_FEEDBACK_DOCK_STATE)
  })

  it('clears the draft after a successful send and keeps it when a send fails', () => {
    const sent = reduce(openWithDraft(), START, { type: 'submitSucceeded', submissionId: 1 })
    expect(sent).toMatchObject({ submitStatus: 'sent', isOpen: true, draft: { comment: '' } })

    const failed = reduce(openWithDraft(), START, {
      type: 'submitFailed',
      submissionId: 1,
      error: INSERT_FAILED,
    })
    expect(failed).toMatchObject({
      submitStatus: 'error',
      error: INSERT_FAILED,
      draft: { comment: 'Broken link' },
    })
  })

  it('starts a fresh draft on the same page with send more', () => {
    const sent = reduce(openWithDraft(), START, { type: 'submitSucceeded', submissionId: 1 })

    expect(reduce(sent, { type: 'sendMore' })).toMatchObject({
      submitStatus: 'idle',
      vote: 'no',
      targetPage: PAGE_A,
      draft: { comment: '' },
    })
  })

  it('ignores results from a superseded, closed or reopened submission', () => {
    const retrying = reduce(
      openWithDraft(),
      START,
      { type: 'submitFailed', submissionId: 1, error: INSERT_FAILED },
      START
    )
    expect(reduce(retrying, { type: 'commentSaved', submissionId: 1 })).toBe(retrying)
    expect(reduce(retrying, { type: 'submitSucceeded', submissionId: 1 })).toBe(retrying)
    expect(reduce(retrying, { type: 'submitFailed', submissionId: 1, error: INSERT_FAILED })).toBe(
      retrying
    )
    expect(reduce(retrying, { type: 'submitSucceeded', submissionId: 2 }).submitStatus).toBe('sent')

    const closed = reduce(openWithDraft(), START, { type: 'closeDock' })
    expect(reduce(closed, { type: 'submitSucceeded', submissionId: 1 })).toBe(closed)

    const reopened = reduce(closed, { type: 'openDock', vote: 'no', page: PAGE_A }, START)
    expect(reduce(reopened, { type: 'submitSucceeded', submissionId: 1 })).toBe(reopened)
  })
})
