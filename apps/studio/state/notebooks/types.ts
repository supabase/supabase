import { SnippetStatus } from '@/data/content/snippet-status'
import type { Notebooks } from '@/types'

export interface Notebook {
  id: string
  type: 'notebook'
  name: string
  description?: string
  visibility: 'project'
  favorite: boolean
  owner_id: number
  project_id: number
  content?: Notebooks.Content // Undefined until loaded
}

export interface StateNotebook {
  projectRef: string
  notebook: Notebook
  status: SnippetStatus
}
