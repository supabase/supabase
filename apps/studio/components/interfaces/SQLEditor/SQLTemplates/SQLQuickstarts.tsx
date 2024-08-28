import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import { useParams, useTelemetryProps } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import Telemetry from 'lib/telemetry'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createSqlSnippetSkeleton, createSqlSnippetSkeletonV2 } from '../SQLEditor.utils'
import SQLCard from './SQLCard'

const SQLQuickstarts = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const [, quickStart] = partition(SQL_TEMPLATES, { type: 'template' })

  const snap = useSqlEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const telemetryProps = useTelemetryProps()
  const enableFolders = useFlag('sqlFolderOrganization')

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const handleNewQuery = async (sql: string, name: string) => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
    }

    try {
      if (enableFolders) {
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
      } else {
        const snippet = createSqlSnippetSkeleton({
          id: uuidv4(),
          name,
          sql,
          owner_id: profile.id,
          project_id: project.id,
        })
        snap.addSnippet(snippet as SqlSnippet, ref)
        snap.addNeedsSaving(snippet.id!)
        router.push(`/project/${ref}/sql/${snippet.id}`)
      }
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  return (
    <div className="block h-full space-y-8 overflow-y-auto p-6">
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-foreground mb-3 text-xl">Quickstarts</h1>

          <p className="text-foreground-light text-sm">
            Click on any script to fill the query box, modify the script, then click
            <span className="text-code">Run</span>.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {quickStart.map((x) => (
            <SQLCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery(sql, title)
                Telemetry.sendEvent(
                  {
                    category: 'quickstart',
                    action: 'quickstart_clicked',
                    label: x.title,
                  },
                  telemetryProps,
                  router
                )
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SQLQuickstarts
