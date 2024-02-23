import '@graphiql/react/dist/style.css'
import { createGraphiQLFetcher, Fetcher } from '@graphiql/toolkit'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import ExtensionCard from 'components/interfaces/Database/Extensions/ExtensionCard'
import GraphiQL from 'components/interfaces/GraphQL/GraphiQL'
import { DocsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Connecting from 'components/ui/Loading/Loading'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { getRoleImpersonationJWT, ImpersonationRole } from 'lib/role-impersonation'
import { useSubscribeToImpersonatedRole } from 'state/role-impersonation-state'
import { NextPageWithLayout } from 'types'

const GraphiQLPage: NextPageWithLayout = () => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const currentTheme = resolvedTheme?.includes('dark') ? 'dark' : 'light'

  const { data, isLoading: isExtensionsLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const pgGraphqlExtension = (data ?? []).find((ext) => ext.name === 'pg_graphql')

  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const { data: settings, isFetched } = useProjectApiQuery({ projectRef })

  const apiService = settings?.autoApiService
  const serviceRoleKey = apiService?.service_api_keys.find((x) => x.name === 'service_role key')
    ? apiService.serviceApiKey
    : undefined

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })
  const jwtSecret = config?.jwt_secret

  const [role, setRole] = useState<ImpersonationRole | undefined>(undefined)
  const [token, setToken] = useState('')

  useSubscribeToImpersonatedRole((role) => setRole(role))

  useEffect(() => {
    if (projectRef && jwtSecret && role?.type === 'postgrest') {
      getRoleImpersonationJWT(projectRef, jwtSecret, role)
        .then((t) => setToken(t))
        .catch((err) => toast.error(`Failed to get role impersonation JWT: ${err.message}`))
    } else {
      setToken('')
    }
  }, [projectRef, jwtSecret, role])

  const fetcher = useMemo(() => {
    const fetcherFn = createGraphiQLFetcher({
      url: `${API_URL}/projects/${projectRef}/api/graphql`,
      fetch,
    })
    const customFetcher: Fetcher = (graphqlParams, opts) => {
      return fetcherFn(graphqlParams, {
        ...opts,
        headers: {
          ...opts?.headers,
          Authorization: `Bearer ${accessToken}`,
          'x-graphql-authorization':
            opts?.headers?.['Authorization'] ?? opts?.headers?.['authorization'] ?? token
              ? `Bearer ${token}`
              : `Bearer ${serviceRoleKey}`,
        },
      })
    }

    return customFetcher
  }, [accessToken, serviceRoleKey, token, projectRef])

  if ((IS_PLATFORM && !accessToken) || !isFetched || (isExtensionsLoading && !pgGraphqlExtension)) {
    return <Connecting />
  }

  if (pgGraphqlExtension?.installed_version === null) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="mt-8 mb-2 text-2xl">Enable the GraphQL Extension</h1>
            <h2 className="text-sm text-foreground-light">
              Toggle the switch below to enable the GraphQL extension. You can then use the GraphQL
              API with your Supabase Database.
            </h2>
          </div>

          <ExtensionCard extension={pgGraphqlExtension} />
        </div>
      </div>
    )
  }

  return <GraphiQL fetcher={fetcher} theme={currentTheme} />
}

GraphiQLPage.getLayout = (page) => <DocsLayout title="GraphiQL">{page}</DocsLayout>
export default observer(GraphiQLPage)
