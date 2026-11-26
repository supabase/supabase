import type { editor } from 'monaco-editor'
import { describe, expect, it, vi } from 'vitest'

import {
  getEditorValueOrSelection,
  isIOSDevice,
  pasteClipboardIntoEditor,
  shouldShowPasteButton,
} from './CodeEditor.utils'

const buildEditor = ({
  value,
  selectedValue,
  hasSelection,
}: {
  value: string
  selectedValue?: string
  hasSelection: boolean
}): editor.IStandaloneCodeEditor => {
  return {
    getValue: () => value,
    getSelection: () => (hasSelection ? {} : null),
    getModel: () => ({ getValueInRange: () => selectedValue }),
  } as unknown as editor.IStandaloneCodeEditor
}

describe('getEditorValueOrSelection', () => {
  it('returns the selected text when there is a non-empty selection', () => {
    const editorInstance = buildEditor({
      value: 'select * from a;\nselect * from b;',
      selectedValue: 'select * from b;',
      hasSelection: true,
    })

    expect(getEditorValueOrSelection(editorInstance)).toBe('select * from b;')
  })

  it('falls back to the full value when there is no selection', () => {
    const editorInstance = buildEditor({
      value: 'select * from a;',
      hasSelection: false,
    })

    expect(getEditorValueOrSelection(editorInstance)).toBe('select * from a;')
  })

  it('falls back to the full value when the selection is collapsed (empty range)', () => {
    const editorInstance = buildEditor({
      value: 'select * from a;',
      selectedValue: '',
      hasSelection: true,
    })

    expect(getEditorValueOrSelection(editorInstance)).toBe('select * from a;')
  })
})

describe('isIOSDevice', () => {
  it('detects iPhone', () => {
    expect(
      isIOSDevice({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        platform: 'iPhone',
        maxTouchPoints: 5,
      })
    ).toBe(true)
  })

  it('detects iPad', () => {
    expect(
      isIOSDevice({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        platform: 'iPad',
        maxTouchPoints: 5,
      })
    ).toBe(true)
  })

  it('detects iPadOS that reports itself as a Macintosh with touch points', () => {
    expect(
      isIOSDevice({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      })
    ).toBe(true)
  })

  it('is false for a desktop Mac without touch points', () => {
    expect(
      isIOSDevice({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 0,
      })
    ).toBe(false)
  })

  it('is false for Windows and Android', () => {
    expect(
      isIOSDevice({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36',
        platform: 'Win32',
        maxTouchPoints: 10,
      })
    ).toBe(false)
    expect(
      isIOSDevice({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/124.0 Mobile Safari/537.36',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      })
    ).toBe(false)
  })

  it('is false when navigator is unavailable', () => {
    expect(isIOSDevice(undefined)).toBe(false)
  })
})

describe('shouldShowPasteButton', () => {
  // Every permutation of the six inputs. The button is only meant to show when all of
  // them are in the "show" state: opted in, iOS, empty editor, editable, clipboard readable,
  // and the Monaco editor mounted (so a tap can never hit a missing editor).
  const flags = [true, false]
  const permutations = flags.flatMap((showPasteButton) =>
    flags.flatMap((isIOS) =>
      flags.flatMap((isEmpty) =>
        flags.flatMap((isReadOnly) =>
          flags.flatMap((hasClipboard) =>
            flags.map((isEditorMounted) => ({
              showPasteButton,
              isIOS,
              isEmpty,
              isReadOnly,
              hasClipboard,
              isEditorMounted,
            }))
          )
        )
      )
    )
  )

  it.each(permutations)(
    'showPasteButton=$showPasteButton isIOS=$isIOS isEmpty=$isEmpty isReadOnly=$isReadOnly hasClipboard=$hasClipboard isEditorMounted=$isEditorMounted',
    (input) => {
      const expected =
        input.showPasteButton &&
        input.isIOS &&
        input.isEmpty &&
        !input.isReadOnly &&
        input.hasClipboard &&
        input.isEditorMounted

      expect(shouldShowPasteButton(input)).toBe(expected)
    }
  )

  it('shows the button only when every condition is met', () => {
    expect(
      shouldShowPasteButton({
        showPasteButton: true,
        isIOS: true,
        isEmpty: true,
        isReadOnly: false,
        hasClipboard: true,
        isEditorMounted: true,
      })
    ).toBe(true)
  })

  it('hides the button when the editor is read-only', () => {
    expect(
      shouldShowPasteButton({
        showPasteButton: true,
        isIOS: true,
        isEmpty: true,
        isReadOnly: true,
        hasClipboard: true,
        isEditorMounted: true,
      })
    ).toBe(false)
  })

  it('hides the button when the Clipboard API cannot read text', () => {
    expect(
      shouldShowPasteButton({
        showPasteButton: true,
        isIOS: true,
        isEmpty: true,
        isReadOnly: false,
        hasClipboard: false,
        isEditorMounted: true,
      })
    ).toBe(false)
  })

  it('hides the button until the Monaco editor has mounted', () => {
    expect(
      shouldShowPasteButton({
        showPasteButton: true,
        isIOS: true,
        isEmpty: true,
        isReadOnly: false,
        hasClipboard: true,
        isEditorMounted: false,
      })
    ).toBe(false)
  })
})

describe('pasteClipboardIntoEditor', () => {
  const buildPasteEditor = () => {
    const selection = { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
    return {
      getSelection: vi.fn(() => selection),
      executeEdits: vi.fn(),
      pushUndoStop: vi.fn(),
      focus: vi.fn(),
      selection,
    }
  }

  it('inserts clipboard text at the current selection, focuses the editor and reports "pasted"', async () => {
    const instance = buildPasteEditor()
    const clipboard = { readText: vi.fn().mockResolvedValue('select 1;') }

    const result = await pasteClipboardIntoEditor(
      instance as unknown as editor.IStandaloneCodeEditor,
      clipboard
    )

    expect(result).toBe('pasted')
    expect(clipboard.readText).toHaveBeenCalledTimes(1)
    expect(instance.executeEdits).toHaveBeenCalledWith(expect.any(String), [
      expect.objectContaining({ range: instance.selection, text: 'select 1;' }),
    ])
    expect(instance.focus).toHaveBeenCalled()
  })

  it('wraps the paste in undo stops so it is its own undo step', async () => {
    const instance = buildPasteEditor()
    const clipboard = { readText: vi.fn().mockResolvedValue('select 1;') }

    await pasteClipboardIntoEditor(instance as unknown as editor.IStandaloneCodeEditor, clipboard)

    expect(instance.pushUndoStop).toHaveBeenCalledTimes(2)
    const [undoStopBefore, undoStopAfter] = instance.pushUndoStop.mock.invocationCallOrder
    const edit = instance.executeEdits.mock.invocationCallOrder[0]
    expect(undoStopBefore).toBeLessThan(edit)
    expect(undoStopAfter).toBeGreaterThan(edit)
  })

  it('only focuses the editor and reports "empty" when the clipboard is empty', async () => {
    const instance = buildPasteEditor()
    const clipboard = { readText: vi.fn().mockResolvedValue('') }

    const result = await pasteClipboardIntoEditor(
      instance as unknown as editor.IStandaloneCodeEditor,
      clipboard
    )

    expect(result).toBe('empty')
    expect(instance.executeEdits).not.toHaveBeenCalled()
    expect(instance.focus).toHaveBeenCalled()
  })

  it('reports "failed" without throwing when the clipboard read is rejected', async () => {
    const instance = buildPasteEditor()
    const clipboard = { readText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) }

    const result = await pasteClipboardIntoEditor(
      instance as unknown as editor.IStandaloneCodeEditor,
      clipboard
    )

    expect(result).toBe('failed')
    expect(instance.executeEdits).not.toHaveBeenCalled()
    expect(instance.focus).toHaveBeenCalled()
  })

  it('reports "failed" without throwing when the Clipboard API is unavailable', async () => {
    const instance = buildPasteEditor()

    const result = await pasteClipboardIntoEditor(
      instance as unknown as editor.IStandaloneCodeEditor,
      undefined
    )

    expect(result).toBe('failed')
    expect(instance.executeEdits).not.toHaveBeenCalled()
  })

  it('reports "unavailable" without reading the clipboard when there is no editor', async () => {
    const clipboard = { readText: vi.fn().mockResolvedValue('x') }

    await expect(pasteClipboardIntoEditor(null, clipboard)).resolves.toBe('unavailable')
    expect(clipboard.readText).not.toHaveBeenCalled()
  })

  it('reports "failed" without throwing when applying the edit throws', async () => {
    const instance = buildPasteEditor()
    instance.executeEdits.mockImplementation(() => {
      throw new Error('boom')
    })
    const clipboard = { readText: vi.fn().mockResolvedValue('select 1;') }

    await expect(
      pasteClipboardIntoEditor(instance as unknown as editor.IStandaloneCodeEditor, clipboard)
    ).resolves.toBe('failed')
  })
})
