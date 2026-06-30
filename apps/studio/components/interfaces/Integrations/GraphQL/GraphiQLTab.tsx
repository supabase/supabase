import 'graphiql/setup-workers/webpack'
import './graphiql-styles.css'

import { useMonaco, type GraphiQLPlugin } from '@graphiql/react'
import { createGraphiQLFetcher, Fetcher } from '@graphiql/toolkit'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { GraphiQL, HISTORY_PLUGIN } from 'graphiql'
import { User as IconUser } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LogoLoader } from 'ui'

import { DEFAULT_INTROSPECTION_SCHEMA } from './constants'
import styles from './graphiql.module.css'
import { IntrospectionDisabledNotice } from './IntrospectionDisabledNotice'
import { IntrospectionEnabledNotice } from './IntrospectionEnabledNotice'
import { usePgGraphqlIntrospectionStatus } from './usePgGraphqlIntrospectionStatus'
import { getTheme } from '@/components/interfaces/App/MonacoThemeProvider'
import { RoleImpersonationSelector } from '@/components/interfaces/RoleImpersonationSelector'
import { BASE_MONACO_EDITOR_OPTIONS } from '@/components/ui/CodeEditor/CodeEditor.utils'
import { useSessionAccessTokenQuery } from '@/data/auth/session-access-token-query'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import { getRoleImpersonationJWT } from '@/lib/role-impersonation'
import { useGetImpersonatedRoleState } from '@/state/role-impersonation-state'

const ROLE_IMPERSONATION_PLUGIN: GraphiQLPlugin = {
  title: 'Role Impersonation',
  icon: () => <IconUser />,
  content: () => <RoleImpersonationSelector orientation="vertical" />,
}

/**
 * GraphiQL (@graphiql/react) bundles its own Monaco instance, separate from the AMD-loaded one
 * the rest of Studio uses — they only share the global `.monaco-*` CSS class names, not JS state.
 * So theme/options applied here via @graphiql/react's `useMonaco` touch GraphiQL's editors only
 * and never leak onto Studio's editors
 */
const GraphiQLEditorSettings = ({ theme }: { theme: 'dark' | 'light' }) => {
  const { monaco } = useMonaco()

  useEffect(() => {
    if (!monaco) return
    monaco.editor.defineTheme('supabase', getTheme(theme))
    monaco.editor.setTheme('supabase')
  }, [monaco, theme])

  useEffect(() => {
    if (!monaco) return
    const options = {
      ...BASE_MONACO_EDITOR_OPTIONS,
      padding: { top: 16, bottom: 16 },
      glyphMargin: true,
    }
    const applyToEditor = (editor: ReturnType<typeof monaco.editor.getEditors>[number]) =>
      editor.updateOptions(options)

    monaco.editor.getEditors().forEach(applyToEditor)
    const disposable = monaco.editor.onDidCreateEditor(applyToEditor)

    return () => disposable.dispose()
  }, [monaco])

  return null
}

export const GraphiQLTab = () => {
  const { ref: projectRef } = useParams()

  const { resolvedTheme } = useTheme()
  const currentTheme = resolvedTheme?.includes('dark') ? 'dark' : 'light'

  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const { data: project } = useSelectedProjectQuery()

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })
  const jwtSecret = config?.jwt_secret

  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const { can: canReadJWTSecret } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'field.jwt_secret'
  )

  const { notice, schemaComment } = usePgGraphqlIntrospectionStatus({
    projectRef,
    connectionString: project?.connectionString,
    schema: DEFAULT_INTROSPECTION_SCHEMA,
  })

  // Bumped to force GraphiQL to re-mount and re-run introspection after the
  // introspection setting changes in either direction.
  const [graphiqlKey, setGraphiqlKey] = useState(0)

  const plugins = useMemo<GraphiQLPlugin[]>(
    () => (canReadJWTSecret ? [HISTORY_PLUGIN, ROLE_IMPERSONATION_PLUGIN] : [HISTORY_PLUGIN]),
    [canReadJWTSecret]
  )

  const fetcher = useMemo(() => {
    const fetcherFn = createGraphiQLFetcher({
      // [Joshen] Opting to hard code /platform for local to match the routes, so that it's clear what's happening
      url: `${API_URL}${IS_PLATFORM ? '' : '/platform'}/projects/${projectRef}/api/graphql`,
      fetch,
    })
    const customFetcher: Fetcher = async (graphqlParams, opts) => {
      let userAuthorization: string | undefined

      const role = getImpersonatedRoleState().role
      if (
        projectRef !== undefined &&
        jwtSecret !== undefined &&
        role !== undefined &&
        role.type === 'postgrest'
      ) {
        try {
          const token = await getRoleImpersonationJWT(projectRef, jwtSecret, role)
          userAuthorization = 'Bearer ' + token
        } catch (err: any) {
          toast.error(`Failed to get JWT for role: ${err.message}`)
        }
      }

      return fetcherFn(graphqlParams, {
        ...opts,
        headers: {
          ...opts?.headers,
          ...(accessToken && {
            Authorization: `Bearer ${accessToken}`,
          }),
          'x-graphql-authorization':
            opts?.headers?.['Authorization'] ??
            opts?.headers?.['authorization'] ??
            userAuthorization ??
            accessToken,
        },
      })
    }

    return customFetcher
  }, [projectRef, getImpersonatedRoleState, jwtSecret, accessToken])

  const handleIntrospectionChanged = useCallback(() => {
    setGraphiqlKey((k) => k + 1)
  }, [])

  if (IS_PLATFORM && !accessToken) {
    return <LogoLoader />
  }

  return (
    <div className="flex flex-col h-full">
      <GraphiQLEditorSettings theme={currentTheme} />
      {notice === 'opt-in' && (
        <IntrospectionDisabledNotice
          schema={DEFAULT_INTROSPECTION_SCHEMA}
          currentSchemaComment={schemaComment}
          onEnabled={handleIntrospectionChanged}
        />
      )}
      {notice === 'opt-out' && (
        <IntrospectionEnabledNotice
          schema={DEFAULT_INTROSPECTION_SCHEMA}
          currentSchemaComment={schemaComment}
          onDisabled={handleIntrospectionChanged}
        />
      )}
      <div className="flex-1 min-h-0">
        <GraphiQL
          key={graphiqlKey}
          fetcher={fetcher}
          forcedTheme={currentTheme}
          editorTheme={{ dark: 'supabase', light: 'supabase' }}
          className={styles.root}
          plugins={plugins}
        />
      </div>
    </div>
  )
}
