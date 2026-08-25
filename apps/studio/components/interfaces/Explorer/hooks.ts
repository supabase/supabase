import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useState } from 'react'

import { useNotebookQuery } from '@/data/content/notebooks/notebook-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { generateUuid } from '@/lib/api/snippets.browser'
import { useProfile } from '@/lib/profile'
import type { AssistantModel } from '@/state/ai-assistant-state'
import { useAiAssistantState, whenAiAssistantInitialized } from '@/state/ai-assistant-state'
import { useExplorerQueryStateSnapshot } from '@/state/explorer-query'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { type Notebook } from '@/state/notebooks/types'
import { Notebooks } from '@/types'

/**
 * Fetches a notebook's content by id and merges it into the valtio store, so landing on
 * a notebook any way other than creating it in this session (direct link, hard refresh,
 * clicking it from the nav list) still hydrates `notebooksState`.
 */
export const useLoadNotebook = ({ id, projectRef }: { id?: string; projectRef?: string }) => {
  const notebooksSnap = useNotebooksStateSnapshot()
  const currentNotebook = id ? notebooksSnap.notebooks[id] : undefined

  const isCurrentProjectNotebook = currentNotebook?.projectRef === projectRef
  const isNewLocalNotebook = isCurrentProjectNotebook && currentNotebook?.status === 'new'
  const hasLoadedNotebook =
    isCurrentProjectNotebook && currentNotebook?.notebook.content !== undefined

  const { data, error, isError } = useNotebookQuery(
    { projectRef, id },
    {
      retry: false,
      enabled: !isNewLocalNotebook && !hasLoadedNotebook,
    }
  )

  const mergeNotebook = useEffectEvent(() => {
    if (projectRef && data) notebooksSnap.setNotebook({ projectRef, notebook: data })
  })

  useEffect(() => {
    mergeNotebook()
  }, [projectRef, data])

  return { isNotFound: isError && error.code === 404 }
}

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
        cells: cells ?? [],
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

  const [isCreating, setIsCreating] = useState(false)

  const openChat = (id: string) => {
    if (!project) {
      console.error('Project is required')
      return undefined
    }

    router.push(`/project/${project.ref}/explorer/chat/${id}`)
  }

  const createChat = async ({
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

    setIsCreating(true)

    // Hydration replaces the chat map and the selected model wholesale, so wait it out before
    // creating anything — otherwise the new chat is dropped as soon as the persisted state lands.
    await whenAiAssistantInitialized(aiAssistantState)

    aiAssistantState.setContext({
      projectRef: project.ref,
      orgSlug: organization?.slug,
      connectionString: project.connectionString ?? '',
    })
    if (model) aiAssistantState.setModel(model)

    const id = aiAssistantState.createChat({ name, initialMessage })
    setIsCreating(false)

    router.push(`/project/${project.ref}/explorer/chat/${id}`)
    return id
  }

  return { createChat, openChat, isCreating }
}

export const useCreateQuery = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const querySnap = useExplorerQueryStateSnapshot()

  const createQuery = () => {
    if (!project) return console.error('Project is required')

    const id = generateUuid()
    querySnap.createDraft({ id, projectRef: project.ref })

    router.push(`/project/${project.ref}/explorer/query/${id}`)

    return id
  }

  return { createQuery }
}
