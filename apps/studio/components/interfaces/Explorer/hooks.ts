import { untrustedSql } from '@supabase/pg-meta'
import { useRouter } from 'next/router'
import { uuid } from 'zod/v4'

import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { generateUuid } from '@/lib/api/snippets.browser'
import { useProfile } from '@/lib/profile'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { type Notebook } from '@/state/notebooks/types'

export const useCreateNotebook = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const notebooksSnap = useNotebooksStateSnapshot()

  const createNotebook = ({ id: idOverride, name }: { id?: string; name?: string } = {}) => {
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')

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
        // [Joshen] Just adding sample data to play around with, keep for now - clean up at the end
        cells: [
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
            unchecked_sql: untrustedSql('select * from colors;'),
            row_limit: 100,
          },
        ],
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
