import type { Cell } from '@/data/content/notebooks/notebook-schema'
import { SnippetStatus } from '@/data/content/snippet-status'

interface NotebookContent {
  schema_version: string
  cells: Cell[]
}

export interface Notebook {
  id: string
  type: 'notebook'
  name: string
  description?: string
  visibility: 'project'
  favorite: boolean
  owner_id: number
  project_id: number
  content?: NotebookContent // Undefined until loaded
}

export interface StateNotebook {
  projectRef: string
  notebook: Notebook
  status: SnippetStatus
}
