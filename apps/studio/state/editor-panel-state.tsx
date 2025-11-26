import { proxy, snapshot, useSnapshot } from 'valtio'

type Template = {
  name: string
  description: string
  content: string
}

type EditorPanelState = {
  value: string
  templates: Template[]
  results: any[] | undefined
  error: any
  initialPrompt: string
  onChange: ((value: string) => void) | undefined
}

const initialState: EditorPanelState = {
  value: '',
  templates: [],
  results: undefined,
  error: undefined,
  initialPrompt: '',
  onChange: undefined,
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
  setResults(results: any[] | undefined) {
    editorPanelState.results = results
  },
  setError(error: any) {
    editorPanelState.error = error
  },
  setInitialPrompt(initialPrompt: string) {
    editorPanelState.initialPrompt = initialPrompt
  },
  reset() {
    Object.assign(editorPanelState, initialState)
  },
})

export const getEditorPanelStateSnapshot = () => snapshot(editorPanelState)

export const useEditorPanelStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(editorPanelState, options)
