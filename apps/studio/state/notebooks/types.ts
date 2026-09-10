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
  updated_at?: string // Absent for a notebook that's never been saved
}

export interface StateNotebook {
  projectRef: string
  notebook: Notebook
  status: SnippetStatus
}
