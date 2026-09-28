import { describe, expect, it } from 'vitest'

import {
  feedbackDockReducer,
  INITIAL_FEEDBACK_DOCK_STATE,
  type FeedbackDockAction,
  type FeedbackDockState,
} from './feedback-dock.reducer'
import type { FeedbackImage } from './feedback-images.utils'
import type { FeedbackPin } from './feedback-schema'

describe('feedbackDockReducer', () => {
  it('opens on the voted page with an empty draft', () => {
    const state = reduce(INITIAL_FEEDBACK_DOCK_STATE, {
      type: 'openDock',
      vote: 'no',
      page: PAGE_A,
    })

    expect(state.isOpen).toBe(true)
    expect(state.vote).toBe('no')
    expect(state.targetPage).toEqual(PAGE_A)
    expect(state.draft).toEqual({ comment: '', pins: [], images: [] })
  })

  it('switches the vote and keeps the draft', () => {
    const state = reduce(openWithDraft(), { type: 'openDock', vote: 'yes', page: PAGE_A })

    expect(state.vote).toBe('yes')
    expect(state.draft).toEqual(openWithDraft().draft)
  })

  it('retargets another page and keeps pins pinned on the first page', () => {
    const state = reduce(openWithDraft(), { type: 'openDock', vote: 'no', page: PAGE_B })

    expect(state.targetPage).toEqual(PAGE_B)
    expect(state.draft.pins).toEqual([makePin(0)])
    expect(state.draft.comment).toBe('Broken link')
  })

  it('opens at the requested placement but keeps it on a vote switch', () => {
    const island = reduce(INITIAL_FEEDBACK_DOCK_STATE, {
      type: 'openDock',
      vote: 'no',
      page: PAGE_A,
      placement: 'center',
    })
    expect(island.placement).toBe('center')

    const moved = reduce(island, { type: 'setPlacement', placement: 'top-left' })
    const switched = reduce(moved, {
      type: 'openDock',
      vote: 'yes',
      page: PAGE_A,
      placement: 'center',
    })
    expect(switched.placement).toBe('top-left')
  })

  it('returns the same state for the same vote and page', () => {
    const open = openWithDraft()
    expect(reduce(open, { type: 'openDock', vote: 'no', page: PAGE_A })).toBe(open)
  })

  it('keeps the vote and page locked once the comment row is saved', () => {
    const saved = reduce(openWithDraft(), START, { type: 'commentSaved', submissionId: 1 })
    const failed = reduce(saved, {
      type: 'submitFailed',
      submissionId: 1,
      error: { kind: 'insert_failed', isOffline: false },
    })

    const state = reduce(failed, { type: 'openDock', vote: 'yes', page: PAGE_B })

    expect(state).toBe(failed)
    expect(state.vote).toBe('no')
    expect(state.targetPage).toEqual(PAGE_A)
    expect(state.submitProgress).toBe('comment_saved')
  })

  it('keeps the vote locked while a send is in flight', () => {
    const sending = reduce(openWithDraft(), START)
    expect(reduce(sending, { type: 'openDock', vote: 'yes', page: PAGE_A })).toBe(sending)
  })

  it('accepts 10 pins and flags the 11th without adding it', () => {
    const tenPins = reduce(
      INITIAL_FEEDBACK_DOCK_STATE,
      ...Array.from(
        { length: 10 },
        (_, i): FeedbackDockAction => ({ type: 'addPin', pin: makePin(i) })
      )
    )
    expect(tenPins.draft.pins).toHaveLength(10)
    expect(tenPins.capNotice).toBeNull()

    const eleven = reduce(tenPins, { type: 'addPin', pin: makePin(10) })
    expect(eleven.draft.pins).toHaveLength(10)
    expect(eleven.capNotice).toBe('pins')
    expect(reduce(eleven, { type: 'setPicking', isPicking: true }).isPicking).toBe(false)
  })

  it('accepts 5 images and flags the overflow without adding it', () => {
    const three = [0, 1, 2].map(makeImage)
    const state = reduce(
      openWithDraft(),
      { type: 'addImages', images: three },
      { type: 'addImages', images: [3, 4, 5].map(makeImage) }
    )

    expect(state.draft.images.map((image) => image.path)).toEqual(
      [0, 1, 2, 3, 4].map((i) => makeImage(i).path)
    )
    expect(state.capNotice).toBe('images')
  })

  it('removes an image by path and clears the image cap notice', () => {
    const full = reduce(openWithDraft(), {
      type: 'addImages',
      images: [0, 1, 2, 3, 4, 5].map(makeImage),
    })
    const state = reduce(full, { type: 'removeImage', path: makeImage(0).path })

    expect(state.draft.images.map((image) => image.path)).toEqual(
      [1, 2, 3, 4].map((i) => makeImage(i).path)
    )
    expect(state.capNotice).toBeNull()
  })

  it('closes, clears the draft and turns picking off', () => {
    const busy = reduce(
      openWithDraft(),
      { type: 'setPicking', isPicking: true },
      { type: 'setPlacement', placement: 'top-left' }
    )
    const state = reduce(busy, { type: 'closeDock' })

    expect(state).toEqual({ ...INITIAL_FEEDBACK_DOCK_STATE, placement: 'top-left' })
  })

  it('clears the draft after a successful send', () => {
    const state = reduce(
      openWithDraft(),
      { type: 'addImages', images: [makeImage(0)] },
      START,
      { type: 'commentSaved', submissionId: 1 },
      { type: 'submitSucceeded', submissionId: 1 }
    )

    expect(state.submitStatus).toBe('sent')
    expect(state.submitProgress).toBe('idle')
    expect(state.draft).toEqual(INITIAL_FEEDBACK_DOCK_STATE.draft)
    expect(state.isOpen).toBe(true)
  })

  it('keeps the draft when a send fails', () => {
    const error = { kind: 'insert_failed', isOffline: true } as const
    const state = reduce(openWithDraft(), START, { type: 'submitFailed', submissionId: 1, error })

    expect(state.submitStatus).toBe('error')
    expect(state.error).toEqual(error)
    expect(state.draft).toEqual(openWithDraft().draft)
  })

  it('ignores send results that land after the dock closed', () => {
    const closed = reduce(openWithDraft(), START, { type: 'closeDock' })
    expect(reduce(closed, { type: 'submitSucceeded', submissionId: 1 })).toBe(closed)
  })

  it('starts a fresh draft on the same page with send more', () => {
    const sent = reduce(openWithDraft(), START, { type: 'submitSucceeded', submissionId: 1 })
    const state = reduce(sent, { type: 'sendMore' })

    expect(state.submitStatus).toBe('idle')
    expect(state.vote).toBe('no')
    expect(state.targetPage).toEqual(PAGE_A)
    expect(state.draft).toEqual(INITIAL_FEEDBACK_DOCK_STATE.draft)
  })

  it('ignores results from a superseded submission', () => {
    const failed = reduce(openWithDraft(), START, {
      type: 'submitFailed',
      submissionId: 1,
      error: INSERT_FAILED,
    })
    const retrying = reduce(failed, START)
    expect(retrying.submissionId).toBe(2)

    expect(reduce(retrying, { type: 'commentSaved', submissionId: 1 })).toBe(retrying)
    expect(reduce(retrying, { type: 'submitSucceeded', submissionId: 1 })).toBe(retrying)
    expect(reduce(retrying, { type: 'submitFailed', submissionId: 1, error: INSERT_FAILED })).toBe(
      retrying
    )
    expect(reduce(retrying, { type: 'submitSucceeded', submissionId: 2 }).submitStatus).toBe('sent')
  })

  it('ignores a send that started before the dock was closed and reopened', () => {
    const reopened = reduce(
      openWithDraft(),
      START,
      { type: 'closeDock' },
      { type: 'openDock', vote: 'no', page: PAGE_A },
      { type: 'setComment', comment: 'Second try' },
      START
    )

    expect(reduce(reopened, { type: 'submitSucceeded', submissionId: 1 })).toBe(reopened)
  })

  it('stops picking when a send starts and refuses new pins and image changes', () => {
    const sending = reduce(
      openWithDraft(),
      { type: 'addImages', images: [makeImage(0)] },
      { type: 'setPicking', isPicking: true },
      START
    )

    expect(sending.isPicking).toBe(false)
    expect(reduce(sending, { type: 'addPin', pin: makePin(1) })).toBe(sending)
    expect(reduce(sending, { type: 'addImages', images: [makeImage(1)] })).toBe(sending)
    expect(reduce(sending, { type: 'removeImage', path: makeImage(0).path })).toBe(sending)

    const saved = reduce(
      sending,
      { type: 'commentSaved', submissionId: 1 },
      { type: 'submitFailed', submissionId: 1, error: INSERT_FAILED }
    )
    expect(reduce(saved, { type: 'addPin', pin: makePin(1) })).toBe(saved)
    expect(reduce(saved, { type: 'addImages', images: [makeImage(1)] })).toBe(saved)
  })

  it('freezes the tab params at the first send and clears them once sent', () => {
    const failed = reduce(openWithDraft(), START, {
      type: 'submitFailed',
      submissionId: 1,
      error: INSERT_FAILED,
    })
    expect(failed.pendingQuery).toEqual(QUERY)

    const sent = reduce(failed, START, { type: 'submitSucceeded', submissionId: 2 })
    expect(sent.pendingQuery).toBeNull()
  })

  it('clears only the cap notice of the list an item was removed from', () => {
    const pinsFull = reduce(
      openWithDraft(),
      ...Array.from(
        { length: 10 },
        (_, i): FeedbackDockAction => ({ type: 'addPin', pin: makePin(i + 1) })
      ),
      { type: 'addImages', images: [makeImage(0)] }
    )
    expect(pinsFull.capNotice).toBe('pins')

    const imagePath = makeImage(0).path
    expect(reduce(pinsFull, { type: 'removeImage', path: imagePath }).capNotice).toBe('pins')
    expect(reduce(pinsFull, { type: 'removePin', index: 0 }).capNotice).toBeNull()

    const imagesFull: FeedbackDockState = { ...pinsFull, capNotice: 'images' }
    expect(reduce(imagesFull, { type: 'removePin', index: 0 }).capNotice).toBe('images')
    expect(reduce(imagesFull, { type: 'removeImage', path: imagePath }).capNotice).toBeNull()
  })
})

const PAGE_A = { pathname: '/guides/auth' }
const PAGE_B = { pathname: '/guides/storage' }
const QUERY = { language: 'js' }
const START: FeedbackDockAction = { type: 'submitStarted', query: QUERY }
const INSERT_FAILED = { kind: 'insert_failed', isOffline: false } as const

const reduce = (state: FeedbackDockState, ...actions: FeedbackDockAction[]) =>
  actions.reduce(feedbackDockReducer, state)

const openWithDraft = () =>
  reduce(
    INITIAL_FEEDBACK_DOCK_STATE,
    { type: 'openDock', vote: 'no', page: PAGE_A },
    { type: 'setComment', comment: 'Broken link' },
    { type: 'addPin', pin: makePin(0) }
  )

const makePin = (i: number): FeedbackPin => ({
  pathname: PAGE_A.pathname,
  tag: 'pre',
  role: 'code',
  name: null,
  text: `npm install ${i}`,
  headingId: 'install',
  headingText: 'Install',
})

const IMAGE_FILE = new File(['png'], 'screenshot.png', { type: 'image/png' })

const makeImage = (i: number): FeedbackImage => ({ path: `image-${i}.png`, file: IMAGE_FILE })
