import remarkGfm from 'remark-gfm'
import ReactMarkdown from 'react-markdown'
import { PropsWithChildren } from 'react'
import { useParams } from 'common'
import { CommandMenuProvider } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { createSqlSnippetSkeleton } from '../SQLEditor/SQLEditor.utils'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useProfileQuery } from 'data/profile/profile-query'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useContentCreateMutation } from 'data/content/content-create-mutation'

const CommandMenuWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { ui } = useStore()
  const snap = useSqlEditorStateSnapshot()

  const { data: profile } = useProfileQuery()
  const { data: settings } = useProjectApiQuery({ projectRef: ref })
  const { mutateAsync: createContent } = useContentCreateMutation()
  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const apiKeys = {
    anon: settings?.autoApiService?.defaultApiKey ?? undefined,
    service: settings?.autoApiService?.serviceApiKey ?? undefined,
  }

  const onSaveGeneratedSQL = async (answer: string, resolve: any) => {
    if (!ref) return console.error('Project ref is required')
    if (!canCreateSQLSnippet) {
      return ui.setNotification({
        category: 'info',
        message: 'Your queries will not be saved as you do not have sufficient permissions',
      })
    }

    // Remove markdown syntax from returned answer
    answer = answer.replace(/`/g, '').replace(/sql\n/g, '')

    const formattedSql = `
-- Note: This query was generated via Supabase AI, please verify the correctness of the
-- SQL snippet before running it against your database as we are not able to guarantee it
-- will do exactly what you requested the AI.

${answer}
`.trim()

    try {
      const payload = createSqlSnippetSkeleton({
        name: 'Generated query',
        owner_id: profile?.id,
        sql: formattedSql,
      })
      await createContent(
        { projectRef: ref, payload },
        {
          onSuccess(data) {
            snap.addSnippet(data.content[0] as SqlSnippet, ref)
            ui.setNotification({
              category: 'success',
              message: `Successfully saved snippet!`,
            })
          },
        }
      )
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    } finally {
      resolve()
    }
  }

  return (
    <CommandMenuProvider
      site="studio"
      projectRef={ref}
      apiKeys={apiKeys}
      MarkdownHandler={(props) => <ReactMarkdown remarkPlugins={[remarkGfm]} {...props} />}
      onSaveGeneratedSQL={onSaveGeneratedSQL}
    >
      {children}
    </CommandMenuProvider>
  )
}

export default CommandMenuWrapper
