import { untrustedSql } from '@supabase/pg-meta'
import { useRouter } from 'next/router'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { generateUuid } from '@/lib/api/snippets.browser'
import { useProfile } from '@/lib/profile'
import type { AssistantModel } from '@/state/ai-assistant-state'
import { useAiAssistantState } from '@/state/ai-assistant-state'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { type Notebook } from '@/state/notebooks/types'
import { Notebooks } from '@/types'

export const useCreateNotebook = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const notebooksSnap = useNotebooksStateSnapshot()

  const createNotebook = ({
    id: idOverride,
    name,
    cells,
  }: { id?: string; name?: string; cells?: Notebooks.Content['cells'] } = {}) => {
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')

    // [Joshen] Just adding sample data to play around with, keep for now - clean up at the end
    const DEFAULT_CELLS = [
      {
        _tag: 'markdown_cell',
        id: generateUuid(),
        text: `
# Title
A brief description on what this notebook is about
        `.trim(),
      },
      {
        _tag: 'markdown_cell',
        id: generateUuid(),
        text: `
## Section
This is a sample paragraph to demonstrate the Markdown cells
1. List item 1
2. List item 2
3. List item 3
            `,
      },
      {
        _tag: 'database_cell',
        id: generateUuid(),
        view: 'table',
        chart: undefined,
        unchecked_sql: untrustedSql('select * from colors;'),
        row_limit: 100,
      },
    ] as Notebooks.Content['cells']

    const id = idOverride ?? generateUuid()

    const notebook: Notebook = {
      id,
      type: 'notebook',
      name: name ?? 'New Notebook',
      description: '',
      visibility: 'project',
      favorite: false,
      content: {
        schema_version: 1,
        cells: cells ?? DEFAULT_CELLS,
      },
      owner_id: profile.id,
      project_id: project.id,
    }

    notebooksSnap.addNotebook({ projectRef: project.ref, notebook })
    notebooksSnap.addNeedsSaving(notebook.id)

    router.push(`/project/${project.ref}/explorer/notebook/${notebook.id}`)
  }

  return { createNotebook }
}

export const useCreateChat = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const aiAssistantState = useAiAssistantState()

  const openChat = (id: string) => {
    if (!project) {
      console.error('Project is required')
      return undefined
    }

    router.push(`/project/${project.ref}/explorer/chat/${id}`)
  }

  const createChat = ({
    name,
    initialMessage,
    model,
  }: {
    name?: string
    initialMessage?: string
    model?: AssistantModel
  } = {}) => {
    if (!project) {
      console.error('Project is required')
      return undefined
    }

    aiAssistantState.setContext({
      projectRef: project.ref,
      orgSlug: organization?.slug,
      connectionString: project.connectionString ?? '',
    })
    if (model) aiAssistantState.setModel(model)

    const id = aiAssistantState.createChat({ name, initialMessage })
    router.push(`/project/${project.ref}/explorer/chat/${id}`)
    return id
  }

  return { createChat, openChat }
}
