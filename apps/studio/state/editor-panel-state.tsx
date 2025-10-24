import { proxy, snapshot, useSnapshot } from 'valtio'

type Template = {
  name: string
  description: string
  content: string
}

const initialState = {
  value: '',
  templates: [] as Template[],
  results: undefined as any[] | undefined,
  error: undefined as any,
  onChange: undefined as ((value: string) => void) | undefined,
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
  reset() {
    Object.assign(editorPanelState, initialState)
  },
})

export const getEditorPanelStateSnapshot = () => snapshot(editorPanelState)

export const useEditorPanelStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(editorPanelState, options)
