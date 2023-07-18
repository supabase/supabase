import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { PropsWithChildren, useMemo } from 'react'
import { CommandMenuProvider } from 'ui'

import { codeBlock } from 'common-tags'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useCheckPermissions, useFlag, useSelectedOrganization, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { createSqlSnippetSkeleton } from '../SQLEditor/SQLEditor.utils'

const CommandMenuWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { ui } = useStore()
  const selectedOrganization = useSelectedOrganization()
  const { project: selectedProject } = useProjectContext()
  const opt_in_tags = selectedOrganization?.opt_in_tags

  const snap = useSqlEditorStateSnapshot()
  const allowCMDKDataOptIn = useFlag('dashboardCmdkDataOptIn')
  const isOptedInToAI = opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN') ?? false

  const { profile } = useProfile()
  const { data: settings } = useProjectApiQuery({ projectRef: ref })
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const apiKeys = {
    anon: settings?.autoApiService?.defaultApiKey ?? undefined,
    service: settings?.autoApiService?.serviceApiKey ?? undefined,
  }

  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: isOptedInToAI }
  )

  const cmdkMetadata = useMemo(() => {
    return {
      definitions: (data ?? []).map((def) => def.sql.trim()).join('\n\n'),
      flags: { allowCMDKDataOptIn },
    }
  }, [data, allowCMDKDataOptIn])

  const onSaveGeneratedSQL = async (answer: string, title: string) => {
    if (!ref) return console.error('Project ref is required')
    if (!canCreateSQLSnippet) {
      ui.setNotification({
        category: 'info',
        message: 'Unable to save query as you do not have sufficient permissions for this project',
      })
      return
    }

    // Remove markdown syntax from returned answer
    answer = answer.replace(/`/g, '').replace(/sql\n/g, '').trim()

    const formattedSql = codeBlock`
      -- Note: This query was generated via Supabase AI, please verify the correctness of the
      -- SQL snippet before running it against your database as we are not able to guarantee it
      -- will do exactly what you requested the AI.

      ${answer}
    `

    try {
      const snippet = createSqlSnippetSkeleton({
        name: title || 'Generated query',
        owner_id: profile?.id,
        sql: formattedSql,
      })
      const data = { ...snippet, id: uuidv4() }
      snap.addSnippet(data as SqlSnippet, ref)
      ui.setNotification({
        category: 'success',
        message: `Successfully saved snippet!`,
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    }
  }

  return (
    <CommandMenuProvider
      site="studio"
      projectRef={ref}
      apiKeys={apiKeys}
      metadata={cmdkMetadata}
      isOptedInToAI={allowCMDKDataOptIn && isOptedInToAI}
      saveGeneratedSQL={onSaveGeneratedSQL}
    >
      {children}
    </CommandMenuProvider>
  )
}

export default CommandMenuWrapper
