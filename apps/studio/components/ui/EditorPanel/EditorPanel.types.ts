export type Template = {
  name: string
  description: string
  content: string
}

export interface EditorPanelProps {
  open: boolean
  onClose: () => void
  initialValue?: string
  label?: string
  saveLabel?: string
  onSave?: (value: string) => void
  functionName?: string
  templates?: Template[]
  initialPrompt?: string
  onChange?: (value: string) => void
}

export interface EditorPanelState {
  initialValue?: string
  label?: string
  saveLabel?: string
  templates?: Template[]
  initialPrompt?: string
  onSave?: (value: string) => void
}