// @vitest-environment jsdom
import './test-utils/dom-stubs'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BASE_PATH } from '~/lib/constants'
import type { TelemetryEvent } from 'common/telemetry-constants'
import type { Dispatch } from 'react'
import { TooltipProvider } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { focusCommentEditor, readComment } from './comment-editor.utils'
import type { FeedbackDockAction } from './feedback-dock.reducer'
import type { FeedbackPin } from './feedback-schema'
import { PINNED_ELEMENTS } from './pins.utils'
import { FeedbackDockProvider, useFeedbackDock } from './FeedbackDockProvider'
import { resetDomStubs, setElementRect, setMatchMedia, setViewport } from './test-utils/dom-stubs'

const mocks = vi.hoisted(() => ({
  sendTelemetryEvent: vi.fn(),
  mutate: vi.fn(),
  dispatch: null as Dispatch<FeedbackDockAction> | null,
  isPickerChunkBroken: false,
}))

vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => mocks.sendTelemetryEvent }))

vi.mock('~/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }))

// next/dynamic surfaces a failed chunk as a render error like these
vi.mock('./ElementPicker', async (importOriginal) => {
  const { ElementPicker } = await importOriginal<typeof import('./ElementPicker')>()
  return {
    ElementPicker: () => {
      if (mocks.isPickerChunkBroken) throw new Error('Loading chunk failed')
      return <ElementPicker />
    },
  }
})

vi.mock('./useSendDocsFeedback', () => ({
  useSendDocsFeedback: ({ dispatch }: { dispatch: Dispatch<FeedbackDockAction> }) => {
    mocks.dispatch = dispatch
    return { mutate: mocks.mutate }
  },
}))

const PAGE = { pathname: '/guides/auth' }

const PIN: FeedbackPin = {
  pathname: '/guides/auth',
  tag: 'pre',
  role: 'code',
  name: null,
  text: 'npm install @supabase/supabase-js',
  headingId: 'install',
  headingText: 'Install',
}

const Harness = () => {
  const { state, actions } = useFeedbackDock()
  const handleOpen = () => actions.openDock({ vote: 'no', page: PAGE })
  const handleAddPin = () => actions.addPin(PIN)
  const handleOpenFromSheet = () =>
    actions.openDock({ vote: 'no', page: PAGE, opener: document.getElementById('sheet-trigger') })
  const handleOpenFromRemovedButton = () =>
    actions.openDock({ vote: 'no', page: PAGE, opener: document.createElement('button') })

  return (
    <main>
      <button type="button" tabIndex={0} onClick={handleOpen}>
        Open dock
      </button>
      <button type="button" tabIndex={0} onClick={handleAddPin}>
        Add pin
      </button>
      <button type="button" tabIndex={0} id="sheet-trigger">
        On this page
      </button>
      <button type="button" tabIndex={0} onClick={handleOpenFromSheet}>
        Open from sheet
      </button>
      <button type="button" tabIndex={0} onClick={handleOpenFromRemovedButton}>
        Open from removed button
      </button>
      <output data-testid="placement">{state.placement}</output>
    </main>
  )
}

const renderDockProvider = () =>
  render(
    <TooltipProvider>
      <FeedbackDockProvider>
        <Harness />
      </FeedbackDockProvider>
    </TooltipProvider>
  )

const renderOpenDock = async () => {
  renderDockProvider()
  const opener = screen.getByRole('button', { name: 'Open dock' })
  opener.focus()
  fireEvent.click(opener)
  const dock = await screen.findByRole('dialog', { name: 'What went wrong?' })
  return { dock, opener }
}

const getTextarea = () => screen.getByRole('textbox')
const getSendButton = () => screen.getByRole('button', { name: /submit/i })

// jsdom can't edit a contenteditable
const typeComment = (value: string) => {
  const editor = getTextarea()
  Array.from(editor.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .forEach((node) => node.remove())
  editor.prepend(value)
  fireEvent.input(editor)
  focusCommentEditor(editor)
  document.dispatchEvent(new Event('selectionchange'))
}

const getComment = () => readComment(getTextarea())

const SCREENSHOT = new File(['png'], 'screenshot.png', { type: 'image/png' })

const getImageInput = () => {
  const input = document.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('No image input')
  return input
}

const pickFiles = (files: File[]) => fireEvent.change(getImageInput(), { target: { files } })

const getEvents = (action: TelemetryEvent['action']) =>
  mocks.sendTelemetryEvent.mock.calls
    .map(([event]: [TelemetryEvent]) => event)
    .filter((event) => event.action === action)

const dispatch = (action: FeedbackDockAction) =>
  act(() => {
    mocks.dispatch?.(action)
  })

const getLastSend = () => {
  const variables = mocks.mutate.mock.lastCall?.[0]
  if (!variables) throw new Error('Nothing was sent')
  return variables
}

const failLastSend = () =>
  dispatch({
    type: 'submitFailed',
    submissionId: getLastSend().submissionId,
    error: { kind: 'insert_failed', isOffline: false },
  })

beforeEach(() => {
  // jsdom has no object urls
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  window.localStorage.clear()
  setViewport({ width: 1024, height: 768 })
})

afterEach(() => {
  cleanup()
  resetDomStubs()
  vi.clearAllMocks()
  vi.restoreAllMocks()
  mocks.isPickerChunkBroken = false
  window.history.replaceState(null, '', '/')
})

describe('FeedbackDock', () => {
  it('opens as a dialog titled by the vote and focuses the textarea', async () => {
    await renderOpenDock()

    expect(document.activeElement).toBe(getTextarea())
  })

  it('refocuses the textarea when the same vote is clicked again', async () => {
    const { opener } = await renderOpenDock()

    opener.focus()
    fireEvent.click(opener)

    expect(document.activeElement).toBe(getTextarea())
  })

  it('enables Send only once the comment has non-whitespace text', async () => {
    await renderOpenDock()

    expect(getSendButton()).toHaveProperty('disabled', true)
    typeComment('   ')
    expect(getSendButton()).toHaveProperty('disabled', true)
    typeComment('a')
    expect(getSendButton()).toHaveProperty('disabled', false)
  })

  it('closes on Escape with an empty draft and returns focus to the opener', async () => {
    const { opener } = await renderOpenDock()

    fireEvent.keyDown(getTextarea(), { key: 'Escape' })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
    expect(getEvents('docs_feedback_dock_closed')).toEqual([
      { action: 'docs_feedback_dock_closed', properties: { reason: 'dismissed', hadDraft: false } },
    ])
  })

  it('asks before discarding a draft on Escape', async () => {
    await renderOpenDock()
    typeComment('The code sample fails')

    fireEvent.keyDown(getTextarea(), { key: 'Escape' })
    expect(screen.getByRole('group', { name: 'Discard feedback?' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.queryByRole('group', { name: 'Discard feedback?' })).toBeNull()
    expect(getComment()).toBe('The code sample fails')
    expect(getEvents('docs_feedback_dock_closed')).toEqual([])
    expect(mocks.mutate).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).toBeNull()

    fireEvent.keyDown(getTextarea(), { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(getEvents('docs_feedback_dock_closed')).toEqual([
      { action: 'docs_feedback_dock_closed', properties: { reason: 'discarded', hadDraft: true } },
    ])
  })

  it('exits pin mode on the first Escape and keeps the dock open', async () => {
    await renderOpenDock()
    const pinToggle = screen.getByRole('button', { name: 'Pin an element' })

    fireEvent.click(pinToggle)
    expect(pinToggle.getAttribute('aria-pressed')).toBe('true')

    fireEvent.keyDown(getTextarea(), { key: 'Escape' })

    expect(pinToggle.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('drags a pill to another spot in the text without scrolling to it', async () => {
    await renderOpenDock()
    typeComment('Fix this')
    fireEvent.click(screen.getByRole('button', { name: 'Add pin' }))
    const editor = getTextarea()
    const text = editor.firstChild
    if (!(text instanceof Text)) throw new Error('Expected the comment text first')
    // jsdom has no layout, so every point resolves to just before "this"
    const dropRange = document.createRange()
    dropRange.setStart(text, 4)
    document.caretRangeFromPoint = () => dropRange.cloneRange()
    const pill = screen.getByRole('button', { name: 'Code block · Install' })
    const scrollIntoView = vi.fn()
    PINNED_ELEMENTS.set(PIN, Object.assign(document.createElement('pre'), { scrollIntoView }))

    fireEvent.pointerDown(pill, { button: 0, clientX: 100, clientY: 10 })
    fireEvent.pointerMove(window, { clientX: 40, clientY: 10 })
    fireEvent.pointerUp(window, { clientX: 40, clientY: 10 })
    fireEvent.click(pill)

    expect(getComment()).toBe('Fix  this')
    expect(editor.childNodes[1]).toBe(editor.querySelector('[data-inline-attachment]'))
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('inserts a pin inline with the caret one space after it, and removes it on delete', async () => {
    await renderOpenDock()
    typeComment('It breaks in')
    fireEvent.click(screen.getByRole('button', { name: 'Add pin' }))

    const editor = getTextarea()
    const pill = editor.querySelector('[data-inline-attachment]')
    const selection = document.getSelection()
    expect(getComment()).toBe('It breaks in ')
    expect(document.activeElement).toBe(editor)
    expect(selection?.anchorNode?.previousSibling).toBe(pill)
    expect(selection?.anchorOffset).toBe(1)

    pill?.remove()
    fireEvent.input(editor)

    expect(screen.queryByRole('button', { name: 'Code block · Install' })).toBeNull()
    expect(getEvents('docs_feedback_pin_removed')).toEqual([
      { action: 'docs_feedback_pin_removed', properties: { pinCount: 0 } },
    ])
  })

  it('keeps the draft after a failed send and shows Feedback sent after a retry', async () => {
    await renderOpenDock()
    fireEvent.click(screen.getByRole('button', { name: 'Add pin' }))
    typeComment('The code sample fails')

    fireEvent.click(getSendButton())
    fireEvent.click(getSendButton())
    expect(mocks.mutate).toHaveBeenCalledTimes(1)
    const firstSubmissionId = getLastSend().submissionId

    failLastSend()

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(getComment()).toBe('The code sample fails')
    expect(screen.getByRole('button', { name: 'Code block · Install' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mocks.mutate).toHaveBeenCalledTimes(2)

    dispatch({ type: 'submitSucceeded', submissionId: firstSubmissionId })
    expect(screen.queryByRole('dialog', { name: 'Feedback sent' })).toBeNull()

    dispatch({ type: 'submitSucceeded', submissionId: getLastSend().submissionId })

    expect(screen.getByRole('dialog', { name: 'Feedback sent' })).toBeTruthy()
  })

  it('shows the offline message when the send failed offline', async () => {
    await renderOpenDock()
    typeComment('The code sample fails')
    fireEvent.click(getSendButton())

    dispatch({
      type: 'submitFailed',
      submissionId: getLastSend().submissionId,
      error: { kind: 'insert_failed', isOffline: true },
    })

    expect(screen.getByRole('alert').textContent).toMatch(/offline/)
  })

  it('snaps to a new corner only after a real drag', async () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { dock } = await renderOpenDock()
    setElementRect(dock, { left: 708, top: 460, width: 300, height: 292 })
    const grip = screen.getByRole('heading')

    fireEvent.pointerDown(grip, { button: 0, pointerId: 1, clientX: 720, clientY: 470 })
    fireEvent.pointerMove(grip, { pointerId: 1, buttons: 1, clientX: 717, clientY: 470 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 717, clientY: 470 })

    expect(screen.getByTestId('placement').textContent).toBe('bottom-right')
    expect(getEvents('docs_feedback_dock_moved')).toEqual([])

    fireEvent.pointerDown(grip, { button: 0, pointerId: 2, clientX: 720, clientY: 470 })
    for (const clientX of [670, 620, 520]) {
      now += 16
      fireEvent.pointerMove(grip, { pointerId: 2, buttons: 1, clientX, clientY: 470 })
    }
    fireEvent.pointerUp(grip, { pointerId: 2, clientX: 520, clientY: 470 })

    expect(screen.getByTestId('placement').textContent).toBe('bottom-left')
    expect(getEvents('docs_feedback_dock_moved')).toEqual([
      {
        action: 'docs_feedback_dock_moved',
        properties: { placement: 'bottom-left', method: 'drag' },
      },
    ])
    expect(dock.hasPointerCapture(2)).toBe(false)
  })

  it('drops a drag whose button was released off the panel', async () => {
    const { dock } = await renderOpenDock()
    setElementRect(dock, { left: 708, top: 460, width: 300, height: 292 })
    const grip = screen.getByRole('heading')

    fireEvent.pointerDown(grip, { button: 0, pointerId: 1, clientX: 720, clientY: 470 })
    fireEvent.pointerMove(grip, { pointerId: 1, buttons: 0, clientX: 520, clientY: 470 })
    fireEvent.pointerMove(grip, { pointerId: 1, buttons: 1, clientX: 320, clientY: 470 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 320, clientY: 470 })

    fireEvent.pointerDown(grip, { button: 0, pointerId: 2, clientX: 720, clientY: 470 })
    fireEvent.pointerMove(grip, { pointerId: 2, buttons: 1, clientX: 520, clientY: 470 })
    fireEvent.pointerMove(grip, { pointerId: 2, buttons: 0, clientX: 320, clientY: 470 })
    fireEvent.pointerUp(grip, { pointerId: 2, clientX: 320, clientY: 470 })

    expect(screen.getByTestId('placement').textContent).toBe('bottom-right')
    expect(getEvents('docs_feedback_dock_moved')).toEqual([])
    expect(dock.hasPointerCapture(2)).toBe(false)
  })

  it('drags from a button without clicking it, but not from the textarea', async () => {
    const { dock } = await renderOpenDock()
    setElementRect(dock, { left: 708, top: 460, width: 300, height: 292 })
    const closeButton = screen.getByRole('button', { name: 'Close feedback' })

    fireEvent.pointerDown(closeButton, { button: 0, pointerId: 1, clientX: 990, clientY: 470 })
    fireEvent.pointerMove(closeButton, { pointerId: 1, buttons: 1, clientX: 400, clientY: 470 })
    fireEvent.pointerUp(closeButton, { pointerId: 1, clientX: 400, clientY: 470 })
    fireEvent.click(closeButton)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByTestId('placement').textContent).toBe('bottom-left')

    const textarea = getTextarea()
    fireEvent.pointerDown(textarea, { button: 0, pointerId: 2, clientX: 400, clientY: 500 })
    fireEvent.pointerMove(textarea, { pointerId: 2, buttons: 1, clientX: 900, clientY: 500 })
    fireEvent.pointerUp(textarea, { pointerId: 2, clientX: 900, clientY: 500 })

    expect(screen.getByTestId('placement').textContent).toBe('bottom-left')
    expect(dock.hasPointerCapture(2)).toBe(false)
  })

  it('moves between corners with the arrow keys outside the textarea', async () => {
    await renderOpenDock()
    const closeButton = screen.getByRole('button', { name: 'Close feedback' })

    fireEvent.keyDown(getTextarea(), { key: 'ArrowLeft' })
    expect(getEvents('docs_feedback_dock_moved')).toEqual([])

    fireEvent.keyDown(closeButton, { key: 'ArrowRight' })
    expect(getEvents('docs_feedback_dock_moved')).toEqual([])

    fireEvent.keyDown(closeButton, { key: 'ArrowLeft' })
    fireEvent.keyDown(closeButton, { key: 'ArrowUp' })

    expect(screen.getByTestId('placement').textContent).toBe('top-left')
    expect(getEvents('docs_feedback_dock_moved')).toEqual([
      {
        action: 'docs_feedback_dock_moved',
        properties: { placement: 'bottom-left', method: 'keyboard' },
      },
      {
        action: 'docs_feedback_dock_moved',
        properties: { placement: 'top-left', method: 'keyboard' },
      },
    ])
  })

  it('opens the island variant at the bottom center and reshapes into a corner and back', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    window.history.replaceState(null, '', '/?feedback-dock=island')
    const { dock } = await renderOpenDock()
    typeComment('Keeps my text')

    expect(screen.getByTestId('placement').textContent).toBe('center')

    setElementRect(dock, { left: 212, top: 700, width: 600, height: 52 })
    const islandClose = screen.getByRole('button', { name: 'Close feedback' })
    fireEvent.pointerDown(islandClose, { button: 0, pointerId: 1, clientX: 780, clientY: 726 })
    fireEvent.pointerMove(islandClose, { pointerId: 1, buttons: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerUp(islandClose, { pointerId: 1, clientX: 100, clientY: 100 })

    expect(screen.getByTestId('placement').textContent).toBe('top-left')
    expect(getComment()).toBe('Keeps my text')

    const widgetClose = screen.getByRole('button', { name: 'Close feedback' })
    fireEvent.keyDown(widgetClose, { key: 'ArrowDown' })
    fireEvent.keyDown(widgetClose, { key: 'ArrowRight' })

    expect(screen.getByTestId('placement').textContent).toBe('center')
    expect(getComment()).toBe('Keeps my text')
    expect(getEvents('docs_feedback_dock_moved')).toEqual(
      [
        { placement: 'top-left', method: 'drag' },
        { placement: 'bottom-left', method: 'keyboard' },
        { placement: 'center', method: 'keyboard' },
      ].map((properties) => ({ action: 'docs_feedback_dock_moved', properties }))
    )
  })

  it('never snaps to the center without the island variant', async () => {
    await renderOpenDock()
    const closeButton = screen.getByRole('button', { name: 'Close feedback' })

    fireEvent.keyDown(closeButton, { key: 'ArrowLeft' })
    fireEvent.keyDown(closeButton, { key: 'ArrowRight' })

    expect(screen.getByTestId('placement').textContent).toBe('bottom-right')
  })

  it('cannot be closed while sending', async () => {
    await renderOpenDock()
    typeComment('The code sample fails')
    fireEvent.click(getSendButton())

    const closeButton = screen.getByRole('button', { name: 'Close feedback' })
    fireEvent.keyDown(getTextarea(), { key: 'Escape' })
    fireEvent.click(closeButton)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Discard feedback?' })).toBeNull()
    expect(getEvents('docs_feedback_dock_closed')).toEqual([])

    failLastSend()
    fireEvent.keyDown(getTextarea(), { key: 'Escape' })
    expect(screen.getByRole('group', { name: 'Discard feedback?' })).toBeTruthy()
  })

  it('retries with the tab params from the first attempt', async () => {
    window.history.replaceState(
      null,
      '',
      `${BASE_PATH}/guides/auth?queryGroups=language&language=js`
    )
    await renderOpenDock()
    typeComment('The code sample fails')
    fireEvent.click(getSendButton())
    expect(getLastSend().query).toEqual({ language: 'js' })

    failLastSend()
    window.history.replaceState(
      null,
      '',
      `${BASE_PATH}/guides/auth?queryGroups=language&language=python`
    )
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(mocks.mutate).toHaveBeenCalledTimes(2)
    expect(getLastSend().query).toEqual({ language: 'js' })
  })

  it('starts a new draft without the discard prompt after Send more', async () => {
    await renderOpenDock()
    typeComment('The code sample fails')
    fireEvent.keyDown(getTextarea(), { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    fireEvent.click(getSendButton())
    dispatch({ type: 'submitSucceeded', submissionId: getLastSend().submissionId })

    fireEvent.click(screen.getByRole('button', { name: 'Send more' }))

    expect(screen.queryByRole('group', { name: 'Discard feedback?' })).toBeNull()
    expect(document.activeElement).toBe(getTextarea())
  })

  it('returns focus to the opener passed to openDock', async () => {
    renderDockProvider()
    fireEvent.click(screen.getByRole('button', { name: 'Open from sheet' }))
    await screen.findByRole('dialog')

    fireEvent.keyDown(getTextarea(), { key: 'Escape' })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'On this page' }))
  })

  it('falls back to focusing main when the opener is gone', async () => {
    renderDockProvider()
    fireEvent.click(screen.getByRole('button', { name: 'Open from removed button' }))
    await screen.findByRole('dialog')

    fireEvent.keyDown(getTextarea(), { key: 'Escape' })

    expect(document.activeElement).toBe(screen.getByRole('main'))
  })

  it('turns pin mode off and keeps the draft when its chunk fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.isPickerChunkBroken = true
    await renderOpenDock()
    typeComment('The code sample fails')
    const pinToggle = screen.getByRole('button', { name: 'Pin an element' })

    fireEvent.click(pinToggle)
    await waitFor(() => expect(pinToggle.getAttribute('aria-pressed')).toBe('false'))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(getComment()).toBe('The code sample fails')
  })

  it('hides pin and drag on touch or narrow screens but keeps image attach', async () => {
    setMatchMedia((query) => query.includes('pointer: coarse'))
    await renderOpenDock()

    expect(screen.queryByRole('button', { name: 'Pin an element' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Attach images' })).toBeTruthy()
  })

  it('attaches picked images, sends them, and removes them', async () => {
    await renderOpenDock()
    typeComment('The diagram is wrong')

    pickFiles([SCREENSHOT])

    expect(screen.getByRole('img', { name: 'Attachment 1' })).toBeTruthy()
    expect(getEvents('docs_feedback_image_added')).toEqual([
      { action: 'docs_feedback_image_added', properties: { imageCount: 1, method: 'picker' } },
    ])

    fireEvent.click(getSendButton())
    expect(getLastSend().draft.images.map((image: { file: File }) => image.file)).toEqual([
      SCREENSHOT,
    ])
    failLastSend()

    fireEvent.click(screen.getByRole('button', { name: 'Remove image 1' }))
    expect(screen.queryByRole('img', { name: 'Attachment 1' })).toBeNull()
    expect(getEvents('docs_feedback_image_removed')).toEqual([
      { action: 'docs_feedback_image_removed', properties: { imageCount: 0 } },
    ])
  })

  it('skips unsupported files', async () => {
    await renderOpenDock()

    pickFiles([new File(['gif'], 'loop.gif', { type: 'image/gif' })])

    expect(screen.queryByRole('img', { name: 'Attachment 1' })).toBeNull()
    expect(getEvents('docs_feedback_image_added')).toEqual([])
  })

  it('attaches a pasted image but lets a text paste through', async () => {
    await renderOpenDock()

    fireEvent.paste(getTextarea(), {
      clipboardData: { types: ['text/plain', 'Files'], files: [SCREENSHOT] },
    })
    expect(screen.queryByRole('img', { name: 'Attachment 1' })).toBeNull()

    fireEvent.paste(getTextarea(), { clipboardData: { types: ['Files'], files: [SCREENSHOT] } })
    expect(screen.getByRole('img', { name: 'Attachment 1' })).toBeTruthy()
    expect(getEvents('docs_feedback_image_added')).toEqual([
      { action: 'docs_feedback_image_added', properties: { imageCount: 1, method: 'paste' } },
    ])
  })
})
