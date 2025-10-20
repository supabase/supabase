import { proxy, snapshot, useSnapshot } from 'valtio'

import { SIDEBAR_KEYS, sidebarManagerState } from './sidebar-manager-state'

type Template = {
  name: string
  description: string
  content: string
}

const initialState = {
  initialValue: '',
  label: '',
  saveLabel: 'Save',
  saveValue: '',
  templates: [] as Template[],
  initialPrompt: '',
  selectedSnippetId: undefined as string | undefined,
  onSave: undefined as ((value: string, saveValue: string) => void) | undefined,
  onRunSuccess: undefined as ((value: any[]) => void) | undefined,
  onRunError: undefined as ((value: any) => void) | undefined,
  onChange: undefined as ((value: string) => void) | undefined,
}

export const editorPanelState = proxy({
  ...initialState,
  setSql(sql: string) {
    editorPanelState.initialValue = sql
  },
  setLabel(label: string) {
    editorPanelState.label = label
  },
  setTemplates(templates: Template[]) {
    editorPanelState.templates = templates
  },
  setInitialPrompt(prompt: string) {
    editorPanelState.initialPrompt = prompt
  },
  setSelectedSnippetId(id: string | undefined) {
    editorPanelState.selectedSnippetId = id
  },
  setHandlers({
    onSave,
    onRunSuccess,
    onRunError,
    onChange,
  }: {
    onSave?: (value: string, saveValue: string) => void
    onRunSuccess?: (value: any[]) => void
    onRunError?: (value: any) => void
    onChange?: (value: string) => void
  }) {
    editorPanelState.onSave = onSave
    editorPanelState.onRunSuccess = onRunSuccess
    editorPanelState.onRunError = onRunError
    editorPanelState.onChange = onChange
  },
  configure({
    sql,
    label,
    prompt,
    templates,
    selectedSnippetId,
  }: {
    sql?: string
    label?: string
    prompt?: string
    templates?: Template[]
    selectedSnippetId?: string
  }) {
    if (sql !== undefined) editorPanelState.initialValue = sql
    if (label !== undefined) editorPanelState.label = label
    if (prompt !== undefined) editorPanelState.initialPrompt = prompt
    if (templates !== undefined) editorPanelState.templates = templates
    if (selectedSnippetId !== undefined) editorPanelState.selectedSnippetId = selectedSnippetId
  },
  reset() {
    Object.assign(editorPanelState, initialState)
  },
})

// Register to reset state when sidebar closes (but don't control sidebar open/close)
sidebarManagerState.registerSidebar(SIDEBAR_KEYS.EDITOR_PANEL, {
  onClose: () => {
    // Auto-reset state when sidebar closes
    editorPanelState.reset()
  },
})

export const getEditorPanelStateSnapshot = () => snapshot(editorPanelState)

export const useEditorPanelStateSnapshot = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(editorPanelState, options)
