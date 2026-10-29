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
import { FeedbackDockProvider, useFeedbackDock } from './FeedbackDockProvider'
import { resetDomStubs, setMatchMedia } from './test-utils/dom-stubs'

const mocks = vi.hoisted(() => ({
  sendTelemetryEvent: vi.fn(),
  mutate: vi.fn(),
  dispatch: null as Dispatch<FeedbackDockAction> | null,
  isPickerChunkBroken: false,
  captureScreenshot: vi.fn(),
}))

vi.mock('./capture-screenshot', () => ({ captureScreenshot: mocks.captureScreenshot }))

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
  const { actions } = useFeedbackDock()
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

const pasteFiles = (files: File[]) =>
  fireEvent.paste(getTextarea(), { clipboardData: { types: ['Files'], files } })

const startCapture = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Capture a screenshot' }))
  const hint = await screen.findByText(/Drag over part of the page/)
  if (!hint.parentElement) throw new Error('No capture area')
  return hint.parentElement
}

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
      { action: 'docs_feedback_dock_closed', properties: { reason: 'dismissed' } },
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

    fireEvent.keyDown(getTextarea(), { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(getEvents('docs_feedback_dock_closed')).toEqual([
      { action: 'docs_feedback_dock_closed', properties: { reason: 'discarded' } },
    ])
  })

  it('exits pin mode on the first Escape, keeps the dock open and focuses the comment', async () => {
    await renderOpenDock()
    const pinToggle = screen.getByRole('button', { name: 'Pin an element' })

    pinToggle.focus()
    fireEvent.click(pinToggle)
    expect(pinToggle.getAttribute('aria-pressed')).toBe('true')

    fireEvent.keyDown(pinToggle, { key: 'Escape' })

    expect(pinToggle.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(document.activeElement).toBe(getTextarea())
  })

  it('inserts a pin inline, and removes it on delete', async () => {
    await renderOpenDock()
    typeComment('It breaks in')
    fireEvent.click(screen.getByRole('button', { name: 'Add pin' }))

    const editor = getTextarea()
    const pill = editor.querySelector('[data-inline-attachment]')
    expect(getComment()).toBe('It breaks in ')

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

    failLastSend()

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(getComment()).toBe('The code sample fails')
    expect(screen.getByRole('button', { name: 'Code block · Install' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mocks.mutate).toHaveBeenCalledTimes(2)

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

  it('hides pin mode on touch or narrow screens but keeps image attach', async () => {
    setMatchMedia((query) => query.includes('pointer: coarse'))
    await renderOpenDock()

    expect(screen.queryByRole('button', { name: 'Pin an element' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Capture a screenshot' })).toBeTruthy()
  })

  it('attaches pasted images, sends them, and removes them', async () => {
    await renderOpenDock()
    typeComment('The diagram is wrong')

    pasteFiles([SCREENSHOT])

    expect(screen.getByRole('img', { name: 'Attachment 1' })).toBeTruthy()

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

  it('captures a dragged area of the page as an image', async () => {
    mocks.captureScreenshot.mockResolvedValue(SCREENSHOT)
    await renderOpenDock()

    const area = await startCapture()
    fireEvent.pointerDown(area, { button: 0, pointerId: 1, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(area, { pointerId: 1, clientX: 300, clientY: 250 })
    fireEvent.pointerUp(area, { pointerId: 1, clientX: 300, clientY: 250 })

    expect(mocks.captureScreenshot).toHaveBeenCalledWith({
      left: 100,
      top: 50,
      width: 200,
      height: 200,
    })
    expect(await screen.findByRole('img', { name: 'Attachment 1' })).toBeTruthy()
    expect(getEvents('docs_feedback_image_added')).toEqual([
      { action: 'docs_feedback_image_added', properties: { imageCount: 1, method: 'capture' } },
    ])
  })

  it('cancels a capture on Escape and keeps the dock open', async () => {
    await renderOpenDock()

    await startCapture()
    fireEvent.keyDown(getTextarea(), { key: 'Escape' })

    expect(screen.queryByText(/Drag over part of the page/)).toBeNull()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(mocks.captureScreenshot).not.toHaveBeenCalled()
  })

  it('shows a notice when a capture fails', async () => {
    mocks.captureScreenshot.mockResolvedValue(null)
    await renderOpenDock()

    const area = await startCapture()
    fireEvent.pointerDown(area, { button: 0, pointerId: 1, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(area, { pointerId: 1, clientX: 300, clientY: 250 })
    fireEvent.pointerUp(area, { pointerId: 1, clientX: 300, clientY: 250 })

    expect(await screen.findByText(/Couldn't capture the screenshot/)).toBeTruthy()
  })

  it('skips unsupported files', async () => {
    await renderOpenDock()

    pasteFiles([new File(['gif'], 'loop.gif', { type: 'image/gif' })])

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
