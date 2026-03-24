import { proxy, snapshot, useSnapshot } from 'valtio'

type Template = {
  name: string
  description: string
  content: string
}

export type SqlError = {
  error?: string
  formattedError?: string
  message?: string
}

type EditorPanelState = {
  value: string
  templates: Template[]
  results: Record<string, unknown>[] | undefined
  error: SqlError | undefined
  initialPrompt: string
  onChange: ((value: string) => void) | undefined
  activeSnippetId: string | null
  pendingReset: boolean
}

const initialState: EditorPanelState = {
  value: '',
  templates: [],
  results: undefined,
  error: undefined,
  initialPrompt: '',
  onChange: undefined,
  activeSnippetId: null,
  pendingReset: false,
}

export const editorPanelState = proxy({
  ...initialState,
  setValue(value: string) {
    editorPanelState.value = value
    editorPanelState.onChange?.(value)
    editorPanelState.setResults(undefined)
    editorPanelState.setError(undefined)
  },
  setTemplates(templates: Template[]) {
    editorPanelState.templates = templates
  },
  setResults(results: Record<string, unknown>[] | undefined) {
    editorPanelState.results = results
  },
  setError(error: SqlError | undefined) {
    editorPanelState.error = error
  },
  setInitialPrompt(initialPrompt: string) {
    editorPanelState.initialPrompt = initialPrompt
  },
  setActiveSnippetId(id: string | null) {
    editorPanelState.activeSnippetId = id
  },
  openAsNew() {
    editorPanelState.value = ''
    editorPanelState.results = undefined
    editorPanelState.error = undefined
    editorPanelState.pendingReset = true
  },
  reset() {
    Object.assign(editorPanelState, initialState)
  },
})

export const getEditorPanelStateSnapshot = () => snapshot(editorPanelState)

export const useEditorPanelStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(editorPanelState, options)
