import { describe, expect, it, vi } from 'vitest'

import { pickFile } from './pickFile'

/** Captures the input `pickFile` creates, and whether `click()` happened synchronously. */
const interceptInput = () => {
  const created = { input: undefined as HTMLInputElement | undefined, clickedSync: false }
  const realCreateElement = document.createElement.bind(document)

  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const element = realCreateElement(tagName)
    if (tagName === 'input') {
      created.input = element as HTMLInputElement
      element.click = () => {
        created.clickedSync = true
      }
    }
    return element
  })

  return created
}

const setFiles = (input: HTMLInputElement, files: File[]) => {
  Object.defineProperty(input, 'files', { value: files, configurable: true })
}

describe('pickFile', () => {
  it('opens the picker synchronously, so the user gesture is not lost', () => {
    const created = interceptInput()

    void pickFile()

    expect(created.clickedSync).toBe(true)
    vi.restoreAllMocks()
  })

  it('resolves with the chosen file', async () => {
    const created = interceptInput()
    const pending = pickFile()
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' })

    setFiles(created.input!, [file])
    created.input!.dispatchEvent(new Event('change'))

    await expect(pending).resolves.toBe(file)
    vi.restoreAllMocks()
  })

  it('resolves undefined when the picker is dismissed', async () => {
    const created = interceptInput()
    const pending = pickFile()

    created.input!.dispatchEvent(new Event('cancel'))

    await expect(pending).resolves.toBeUndefined()
    vi.restoreAllMocks()
  })

  it('resolves undefined when the picker closes with no selection', async () => {
    const created = interceptInput()
    const pending = pickFile()

    setFiles(created.input!, [])
    created.input!.dispatchEvent(new Event('change'))

    await expect(pending).resolves.toBeUndefined()
    vi.restoreAllMocks()
  })

  it('passes an accept filter through to the input', () => {
    const created = interceptInput()

    void pickFile({ accept: 'image/*' })

    expect(created.input!.accept).toBe('image/*')
    vi.restoreAllMocks()
  })
})
