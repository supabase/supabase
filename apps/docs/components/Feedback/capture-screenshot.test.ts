// @vitest-environment jsdom
import './test-utils/dom-stubs'

import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { captureScreenshot } from './capture-screenshot'
import { resetDomStubs, setElementRect } from './test-utils/dom-stubs'

const mocks = vi.hoisted(() => ({ toCanvas: vi.fn() }))

vi.mock('html-to-image', () => ({ toCanvas: mocks.toCanvas }))

const createCanvas = ({ hasContext = true }: { hasContext?: boolean } = {}) => {
  const context = { fillStyle: '', fillRect: vi.fn() }
  return {
    context,
    canvas: {
      getContext: () => (hasContext ? context : null),
      toBlob: (callback: (blob: Blob) => void) =>
        callback(new Blob(['png'], { type: 'image/png' })),
    },
  }
}

const SELECTION = { left: 150, top: 100, width: 200, height: 100 }

beforeEach(() => {
  document.body.innerHTML = `
    <main id="${DOCS_CONTENT_CONTAINER_ID}">
      <div id="secret" data-feedback-redact>sb_secret_123</div>
    </main>
  `
  const content = document.getElementById(DOCS_CONTENT_CONTAINER_ID)
  const secret = document.getElementById('secret')
  if (!content || !secret) throw new Error('Missing fixture')
  setElementRect(content, { left: 100, top: -500, width: 800, height: 3000 })
  setElementRect(secret, { left: 300, top: 150, width: 100, height: 20 })
})

afterEach(() => {
  resetDomStubs()
  mocks.toCanvas.mockReset()
})

describe('captureScreenshot', () => {
  it('renders only the selected area of the content', async () => {
    mocks.toCanvas.mockResolvedValue(createCanvas().canvas)

    const file = await captureScreenshot(SELECTION)

    expect(file).toMatchObject({ name: 'screenshot.png', type: 'image/png' })
    expect(mocks.toCanvas.mock.lastCall?.[1]).toMatchObject({
      width: 200,
      height: 100,
      style: { width: '800px', height: '3000px', transform: 'translate(-50px, -600px)' },
    })
  })

  it('blacks out redacted regions inside the selection', async () => {
    const { canvas, context } = createCanvas()
    mocks.toCanvas.mockResolvedValue(canvas)

    await captureScreenshot(SELECTION)

    expect(context.fillRect).toHaveBeenCalledWith(150, 50, 50, 20)
  })

  it('returns no file when it cannot draw the redaction mask', async () => {
    mocks.toCanvas.mockResolvedValue(createCanvas({ hasContext: false }).canvas)

    expect(await captureScreenshot(SELECTION)).toBeNull()
  })

  it('returns no file for a selection outside the content', async () => {
    expect(await captureScreenshot({ left: 0, top: 0, width: 50, height: 50 })).toBeNull()
    expect(mocks.toCanvas).not.toHaveBeenCalled()
  })
})
