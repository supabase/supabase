import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { editor } from 'monaco-editor'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CodeEditor } from './CodeEditor'
import { render } from '@/tests/helpers'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

// jsdom never loads Monaco, so `onMount` and `onChange` would never fire. Replace the Editor
// with a stand-in that renders the same wrapper div and exposes the props CodeEditor passes it,
// letting tests drive the mount and change callbacks the way Monaco does.
const monacoProps = vi.hoisted(() => ({
  current: undefined as
    | undefined
    | {
        onMount: (editor: unknown, monaco: unknown) => void
        onChange: (value: string | undefined) => void
      },
}))

vi.mock('@monaco-editor/react', () => ({
  default: (props: {
    className?: string
    loading?: ReactNode
    onMount: (editor: unknown, monaco: unknown) => void
    onChange: (value: string | undefined) => void
  }) => {
    monacoProps.current = props
    return <div className={props.className} />
  },
  useMonaco: () => null,
}))

/**
 * CodeEditor applies a default `h-full` so editors with no explicit height fill their container
 * (GraphiQL, etc.). Callers that DO set a height (e.g. the email template editor's `h-96`) must
 * win — otherwise the editor collapses to a single line.
 *
 * This regressed once already: #47339 appended the default as `cn(className, 'monaco-editor',
 * 'h-full')`, and `cn` keeps the *last* conflicting height utility, so the trailing
 * `h-full` clobbered caller heights. #47350 fixed it by passing `className` last. These tests
 * lock that ordering in.
 *
 * The `<div className={...}>` that receives the class is rendered by @monaco-editor/react before
 * Monaco loads, so it's present in jsdom without a working editor.
 */
describe('CodeEditor height class precedence', () => {
  const getEditorEl = (container: HTMLElement) => container.querySelector('.monaco-editor')

  it('lets a caller-supplied height win over the default h-full (regression #47350)', () => {
    const { container } = render(<CodeEditor language="pgsql" className="h-96" />)

    const editor = getEditorEl(container)
    expect(editor, 'editor wrapper should render').toBeTruthy()
    expect(editor).toHaveClass('h-96')
    expect(editor, 'default h-full must not override the caller height').not.toHaveClass('h-full')
  })

  it('falls back to the default h-full when the caller sets no height', () => {
    const { container } = render(<CodeEditor language="pgsql" />)

    const editor = getEditorEl(container)
    expect(editor, 'editor wrapper should render').toBeTruthy()
    expect(editor).toHaveClass('h-full')
  })
})

/**
 * The paste button depends on state that only Monaco's callbacks produce (mount, content
 * changes), so these tests drive the stand-in Editor's `onMount` and `onChange` directly. The
 * visibility rule itself is covered exhaustively in CodeEditor.utils.test.ts.
 */
describe('CodeEditor iOS paste button', () => {
  const IPHONE_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  const DESKTOP_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'
  const PASTE_FAILED_MESSAGE = 'Unable to read the clipboard. Copy the text again and retry.'
  const PASTE_EMPTY_MESSAGE = 'Your clipboard is empty'

  const mockNavigator = (overrides: {
    userAgent: string
    platform: string
    maxTouchPoints: number
    clipboard?: { readText: () => Promise<string> }
  }) => {
    vi.stubGlobal('navigator', overrides)
  }
  const mockIOS = (clipboard?: { readText: () => Promise<string> }) =>
    mockNavigator({ userAgent: IPHONE_UA, platform: 'iPhone', maxTouchPoints: 5, clipboard })
  const readable = () => ({ readText: vi.fn().mockResolvedValue('select 1;') })

  const buildEditorInstance = (content = '') => ({
    getValue: vi.fn(() => content),
    getModel: vi.fn(() => null),
    getSelection: vi.fn(() => ({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    })),
    changeViewZones: vi.fn(),
    createContextKey: vi.fn(() => ({ set: vi.fn() })),
    addCommand: vi.fn(),
    addAction: vi.fn(),
    setPosition: vi.fn(),
    executeEdits: vi.fn(),
    pushUndoStop: vi.fn(),
    focus: vi.fn(),
  })
  const fakeMonaco = { KeyMod: { CtrlCmd: 1 }, KeyCode: { KeyK: 2, Tab: 3, Enter: 4 } }

  type EditorInstance = ReturnType<typeof buildEditorInstance>
  const mountEditor = (instance: EditorInstance = buildEditorInstance()) => {
    // handleMount is declared async but runs synchronously; don't hand act() its promise.
    act(() => {
      void monacoProps.current!.onMount(instance, fakeMonaco)
    })
    return instance
  }
  const changeContent = (value: string) =>
    act(() => {
      monacoProps.current!.onChange(value)
    })
  const pasteButton = () => screen.queryByRole('button', { name: 'Paste' })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    monacoProps.current = undefined
  })

  it('renders a Paste button on iOS when the editor is empty and the clipboard is readable', () => {
    mockIOS(readable())
    render(<CodeEditor language="pgsql" showPasteButton />)
    mountEditor()

    expect(screen.getByRole('button', { name: 'Paste' })).toBeInTheDocument()
  })

  it('waits for the Monaco editor to mount before showing the button', () => {
    mockIOS(readable())
    render(<CodeEditor language="pgsql" showPasteButton />)
    expect(pasteButton()).not.toBeInTheDocument()

    mountEditor()

    expect(pasteButton()).toBeInTheDocument()
  })

  it('does not render the button when the editor has content', () => {
    mockIOS(readable())
    render(<CodeEditor language="pgsql" showPasteButton value="select 1;" />)
    mountEditor()

    expect(pasteButton()).not.toBeInTheDocument()
  })

  it('updates visibility when a controlled value changes', () => {
    mockIOS(readable())
    const { rerender } = render(<CodeEditor language="pgsql" showPasteButton value="select 1;" />)
    mountEditor(buildEditorInstance('select 1;'))
    expect(pasteButton()).not.toBeInTheDocument()

    rerender(<CodeEditor language="pgsql" showPasteButton value="" />)

    expect(screen.getByRole('button', { name: 'Paste' })).toBeInTheDocument()
  })

  it('does not render the button on non-iOS devices', () => {
    mockNavigator({
      userAgent: DESKTOP_UA,
      platform: 'Win32',
      maxTouchPoints: 0,
      clipboard: readable(),
    })
    render(<CodeEditor language="pgsql" showPasteButton />)
    mountEditor()

    expect(pasteButton()).not.toBeInTheDocument()
  })

  it('does not render the button unless showPasteButton is set', () => {
    mockIOS(readable())
    render(<CodeEditor language="pgsql" />)
    mountEditor()

    expect(pasteButton()).not.toBeInTheDocument()
  })

  it('does not render the button when the editor is read-only', () => {
    mockIOS(readable())
    render(<CodeEditor language="pgsql" showPasteButton isReadOnly />)
    mountEditor()

    expect(pasteButton()).not.toBeInTheDocument()
  })

  it('does not render the button when the Clipboard API cannot read text', () => {
    mockIOS()
    render(<CodeEditor language="pgsql" showPasteButton />)
    mountEditor()

    expect(pasteButton()).not.toBeInTheDocument()
  })

  describe('uncontrolled editor (the SQL editor path)', () => {
    it('hides the button when a defaultValue is provided', () => {
      mockIOS(readable())
      render(<CodeEditor language="pgsql" showPasteButton defaultValue="select 1" />)
      mountEditor(buildEditorInstance('select 1'))

      expect(pasteButton()).not.toBeInTheDocument()
    })

    it('shows the button when there is no defaultValue', () => {
      mockIOS(readable())
      render(<CodeEditor language="pgsql" showPasteButton />)
      mountEditor()

      expect(pasteButton()).toBeInTheDocument()
    })

    it('hides the button on mount when the Monaco model already holds content', () => {
      mockIOS(readable())
      render(<CodeEditor language="pgsql" showPasteButton />)
      mountEditor(buildEditorInstance('select 1'))

      expect(pasteButton()).not.toBeInTheDocument()
    })

    it('hides the button once the user types and shows it again when cleared', () => {
      mockIOS(readable())
      render(<CodeEditor language="pgsql" showPasteButton />)
      mountEditor()
      expect(pasteButton()).toBeInTheDocument()

      changeContent('select 1')
      expect(pasteButton()).not.toBeInTheDocument()

      changeContent('')
      expect(pasteButton()).toBeInTheDocument()
    })
  })

  describe('tapping Paste', () => {
    const tapPaste = async () => userEvent.click(screen.getByRole('button', { name: 'Paste' }))

    it('reads the clipboard and inserts the text as its own undo step', async () => {
      const clipboard = readable()
      mockIOS(clipboard)
      render(<CodeEditor language="pgsql" showPasteButton />)
      const instance = mountEditor()

      await tapPaste()

      await waitFor(() => expect(clipboard.readText).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(instance.executeEdits).toHaveBeenCalled())
      expect(instance.pushUndoStop).toHaveBeenCalledTimes(2)
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.info).not.toHaveBeenCalled()
    })

    it('shows an error toast when the clipboard read is rejected', async () => {
      mockIOS({ readText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) })
      render(<CodeEditor language="pgsql" showPasteButton />)
      const instance = mountEditor()

      await tapPaste()

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(PASTE_FAILED_MESSAGE))
      expect(instance.executeEdits).not.toHaveBeenCalled()
    })

    it('tells the user the clipboard is empty instead of failing silently', async () => {
      mockIOS({ readText: vi.fn().mockResolvedValue('') })
      render(<CodeEditor language="pgsql" showPasteButton />)
      const instance = mountEditor()

      await tapPaste()

      await waitFor(() => expect(toast.info).toHaveBeenCalledWith(PASTE_EMPTY_MESSAGE))
      expect(toast.error).not.toHaveBeenCalled()
      expect(instance.executeEdits).not.toHaveBeenCalled()
    })

    it('shows the error toast, not an unhandled rejection, when applying the edit throws', async () => {
      mockIOS(readable())
      render(<CodeEditor language="pgsql" showPasteButton />)
      const instance = buildEditorInstance()
      instance.executeEdits.mockImplementation(() => {
        throw new Error('boom')
      })
      mountEditor(instance)

      await tapPaste()

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(PASTE_FAILED_MESSAGE))
    })

    it('stays silent when the editor is no longer available', async () => {
      const clipboard = readable()
      mockIOS(clipboard)
      const editorRef = { current: null as editor.IStandaloneCodeEditor | null }
      render(<CodeEditor language="pgsql" showPasteButton editorRef={editorRef} />)
      mountEditor()
      editorRef.current = null

      await tapPaste()
      await act(async () => {})

      expect(clipboard.readText).not.toHaveBeenCalled()
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.info).not.toHaveBeenCalled()
    })
  })
})
