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
import { readNotebookDraft } from '@/state/notebooks/notebook-drafts'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { type Notebook } from '@/state/notebooks/types'
import { Notebooks } from '@/types'

/**
 * Fetches a notebook's content by id and merges it into the valtio store, so landing on
 * a notebook any way other than creating it in this session (direct link, hard refresh,
 * clicking it from the nav list) still hydrates `notebooksState`.
 *
 * A notebook that isn't in the store yet (the fresh-load case, e.g. after a refresh) is
 * also checked for a locally-persisted draft of unsaved edits: if the notebook loaded from
 * the server, the draft is restored on top of it (see `notebooksState.restoreDraft`); if
 * the notebook was never saved at all (a 404), the draft — if present — is the only copy
 * that ever existed, so it's restored as a new local-only notebook instead.
 */
export const useLoadNotebook = ({ id, projectRef }: { id?: string; projectRef?: string }) => {
  const notebooksSnap = useNotebooksStateSnapshot()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
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

  const isNotFound = isError && error.code === 404

  const mergeNotebook = useEffectEvent(() => {
    if (!projectRef || !id) return

    if (data) {
      const isFreshLoad = !isCurrentProjectNotebook
      notebooksSnap.setNotebook({ projectRef, notebook: data })
      if (isFreshLoad) {
        notebooksSnap.restoreDraft({ projectRef, id, baseUpdatedAt: data.updated_at })
      }
      return
    }

    if (isNotFound && !isCurrentProjectNotebook && profile && project) {
      const draft = readNotebookDraft({ projectRef, id })
      if (!draft) return

      notebooksSnap.addNotebook({
        projectRef,
        notebook: {
          id,
          type: 'notebook',
          name: draft.name,
          description: '',
          visibility: 'project',
          favorite: false,
          content: draft.content,
          owner_id: profile.id,
          project_id: project.id,
        },
      })
    }
  })

  useEffect(() => {
    mergeNotebook()
  }, [projectRef, id, data, isNotFound, !!profile, !!project])

  return { isNotFound: isNotFound && !isCurrentProjectNotebook }
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

    try {
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

      router.push(`/project/${project.ref}/explorer/chat/${id}`)
      return id
    } finally {
      setIsCreating(false)
    }
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
