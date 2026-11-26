import type { editor } from 'monaco-editor'

/**
 * Base Monaco editor options shared across Studio's editors so font size, indentation and
 * chrome stay consistent everywhere a Monaco editor is rendered. CodeEditor layers per-instance
 * options (read-only, line numbers) on top; GraphiQL (which runs its own Monaco instance) layers
 * its own padding/glyphMargin on top via `editor.updateOptions`.
 *
 * Keep this as the single source of truth — don't redeclare these values at call sites.
 */
export const BASE_MONACO_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  tabSize: 2,
  fontSize: 13,
  minimap: { enabled: false },
  wordWrap: 'on',
  fixedOverflowWidgets: false,
  contextmenu: true,
  scrollBeyondLastLine: false,
}

export const alignEditor = (editor: editor.IStandaloneCodeEditor) => {
  // Add margin above first line
  editor.changeViewZones((accessor) => {
    accessor.addZone({
      afterLineNumber: 0,
      heightInPx: 4,
      domNode: document.createElement('div'),
    })
  })
}

/**
 * The text a "run" gesture should act on: the current selection if there is one
 * (a collapsed cursor has an empty range, so `getValueInRange` returns `''` and
 * this falls through), otherwise the full editor value.
 */
export const getEditorValueOrSelection = (
  editor: editor.IStandaloneCodeEditor
): string | undefined => {
  const selection = editor.getSelection()
  const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined
  return selectedValue || editor.getValue()
}

type NavigatorLike = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>

/**
 * iPhone, iPad, and iPadOS 13+ (which reports itself as a Macintosh but has touch points).
 */
export const isIOSDevice = (nav: Partial<NavigatorLike> | undefined): boolean => {
  if (!nav) return false
  const userAgent = nav.userAgent ?? ''
  if (/iPhone|iPad|iPod/.test(userAgent)) return true
  const isMacLike = /Macintosh/.test(userAgent) || nav.platform === 'MacIntel'
  return isMacLike && (nav.maxTouchPoints ?? 0) > 1
}

/**
 * Outcome of a paste attempt:
 * - `pasted`: clipboard text was inserted at the selection.
 * - `empty`: the clipboard was readable but held no text.
 * - `unavailable`: there is no editor yet (Monaco is still loading); nothing was attempted.
 * - `failed`: no Clipboard API, or the read was denied or rejected, or applying the edit threw.
 */
export type PasteClipboardResult = 'pasted' | 'empty' | 'unavailable' | 'failed'

/**
 * Reads the clipboard and inserts the text at the editor's current selection as its own undo
 * step. Never throws: every outcome is returned so the caller decides how to tell the user.
 */
export const pasteClipboardIntoEditor = async (
  editorInstance: editor.IStandaloneCodeEditor | null,
  clipboard: Pick<Clipboard, 'readText'> | undefined
): Promise<PasteClipboardResult> => {
  if (!editorInstance) return 'unavailable'

  try {
    if (!clipboard) {
      editorInstance.focus()
      return 'failed'
    }

    let text: string
    try {
      text = (await clipboard.readText()) ?? ''
    } catch {
      editorInstance.focus()
      return 'failed'
    }

    if (text.length === 0) {
      editorInstance.focus()
      return 'empty'
    }

    const selection = editorInstance.getSelection()
    if (!selection) {
      editorInstance.focus()
      return 'failed'
    }

    editorInstance.pushUndoStop()
    editorInstance.executeEdits('paste-button', [
      { range: selection, text, forceMoveMarkers: true },
    ])
    editorInstance.pushUndoStop()
    editorInstance.focus()
    return 'pasted'
  } catch {
    return 'failed'
  }
}

export type ShouldShowPasteButtonInput = {
  showPasteButton: boolean
  isIOS: boolean
  isEmpty: boolean
  isReadOnly: boolean
  hasClipboard: boolean
  isEditorMounted: boolean
}

/**
 * The iOS Paste button is only useful when Monaco's touch layer has swallowed the long-press
 * menu, so it shows for an opted-in, empty, editable, mounted editor on iOS with a readable
 * clipboard. It waits for the mount so a tap can never reach an editor that does not exist yet.
 */
export const shouldShowPasteButton = ({
  showPasteButton,
  isIOS,
  isEmpty,
  isReadOnly,
  hasClipboard,
  isEditorMounted,
}: ShouldShowPasteButtonInput): boolean =>
  showPasteButton && isIOS && isEmpty && !isReadOnly && hasClipboard && isEditorMounted
