import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createSqlSnippetSkeletonV2 } from './SQLEditor.utils'

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

  const newQuery = async (sql: string, name: string) => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
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
      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  return { newQuery }
}

export default useNewQuery
