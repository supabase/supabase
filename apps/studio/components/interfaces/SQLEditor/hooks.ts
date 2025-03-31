import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { ContentDiff, DiffType } from './SQLEditor.types'
import {
  compareAsAddition,
  compareAsModification,
  compareAsNewSnippet,
  createSqlSnippetSkeletonV2,
} from './SQLEditor.utils'

export const useNewQuery = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { project } = useProjectContext()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const newQuery = async (sql: string, name: string, shouldRedirect: boolean = true) => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    if (!canCreateSQLSnippet) {
      toast('Your queries will not be saved as you do not have sufficient permissions')
      return undefined
    }

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name,
        sql,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snapV2.addSnippet({ projectRef: ref, snippet })
      snapV2.addNeedsSaving(snippet.id)
      if (shouldRedirect) {
        router.push(`/project/${ref}/sql/${snippet.id}`)
        return undefined
      } else {
        return snippet.id
      }
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
      return undefined
    }
  }

  return { newQuery }
}

export function useSqlEditorDiff() {
  const [sourceSqlDiff, setSourceSqlDiff] = useState<ContentDiff>()
  const [selectedDiffType, setSelectedDiffType] = useState<DiffType>()
  const [pendingTitle, setPendingTitle] = useState<string>()
  const [isAcceptDiffLoading, setIsAcceptDiffLoading] = useState(false)

  const isDiffOpen = !!sourceSqlDiff

  const defaultSqlDiff = useMemo(() => {
    if (!sourceSqlDiff) {
      return { original: '', modified: '' }
    }

    switch (selectedDiffType) {
      case DiffType.Modification:
        return compareAsModification(sourceSqlDiff)
      case DiffType.Addition:
        return compareAsAddition(sourceSqlDiff)
      case DiffType.NewSnippet:
        return compareAsNewSnippet(sourceSqlDiff)
      default:
        return { original: '', modified: '' }
    }
  }, [selectedDiffType, sourceSqlDiff])

  const closeDiff = useCallback(() => {
    setSourceSqlDiff(undefined)
    setPendingTitle(undefined)
    setSelectedDiffType(undefined)
  }, [])

  return {
    sourceSqlDiff,
    setSourceSqlDiff,
    selectedDiffType,
    setSelectedDiffType,
    pendingTitle,
    setPendingTitle,
    isAcceptDiffLoading,
    setIsAcceptDiffLoading,
    isDiffOpen,
    defaultSqlDiff,
    closeDiff,
  }
}

interface PromptState {
  isOpen: boolean
  selection: string
  beforeSelection: string
  afterSelection: string
  startLineNumber: number
  endLineNumber: number
}

const initialPromptState: PromptState = {
  isOpen: false,
  selection: '',
  beforeSelection: '',
  afterSelection: '',
  startLineNumber: 0,
  endLineNumber: 0,
}

export function useSqlEditorPrompt() {
  const [promptState, setPromptState] = useState<PromptState>(initialPromptState)
  const [promptInput, setPromptInput] = useState('')

  useEffect(() => {
    if (!promptState.isOpen) {
      setPromptInput('')
    }
  }, [promptState.isOpen])

  const resetPrompt = () => {
    setPromptState(initialPromptState)
    setPromptInput('')
  }

  return {
    promptState,
    setPromptState,
    promptInput,
    setPromptInput,
    resetPrompt,
  }
}

export default useNewQuery
