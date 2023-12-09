import '@graphiql/react/dist/style.css'
import { createGraphiQLFetcher, Fetcher } from '@graphiql/toolkit'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'

import ExtensionCard from 'components/interfaces/Database/Extensions/ExtensionCard'
import GraphiQL from 'components/interfaces/GraphQL/GraphiQL'
import { DocsLayout } from 'components/layouts'
import Connecting from 'components/ui/Loading/Loading'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useStore } from 'hooks'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { getRoleImpersonationJWT } from 'lib/role-impersonation'
import { getImpersonatedRole } from 'state/role-impersonation-state'
import { NextPageWithLayout } from 'types'

const GraphiQLPage: NextPageWithLayout = () => {
  const { ui, meta } = useStore()
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const currentTheme = resolvedTheme?.includes('dark') ? 'dark' : 'light'

  const isExtensionsLoading = meta.extensions.isLoading
  const pgGraphqlExtension = meta.extensions.byId('pg_graphql')

  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const { data: settings, isFetched } = useProjectApiQuery({ projectRef })

  const apiService = settings?.autoApiService
  const serviceRoleKey = apiService?.service_api_keys.find((x) => x.name === 'service_role key')
    ? apiService.serviceApiKey
    : undefined

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })
  const jwtSecret = config?.jwt_secret

  useEffect(() => {
    if (ui.selectedProjectRef) {
      // Schemas may be needed when enabling the GraphQL extension
      meta.extensions.load()
    }
  }, [ui.selectedProjectRef])

  const fetcher = useMemo(() => {
    const fetcherFn = createGraphiQLFetcher({
      url: `${API_URL}/projects/${projectRef}/api/graphql`,
      fetch,
    })
    const customFetcher: Fetcher = (graphqlParams, opts) => {
      let userAuthorization: string | undefined

      const role = getImpersonatedRole()
      if (
        projectRef !== undefined &&
        jwtSecret !== undefined &&
        role !== undefined &&
        role.type === 'postgrest'
      ) {
        userAuthorization = `Bearer ${getRoleImpersonationJWT(projectRef, jwtSecret, role)}`
      }

      return fetcherFn(graphqlParams, {
        ...opts,
        headers: {
          ...opts?.headers,
          Authorization: `Bearer ${accessToken}`,
          'x-graphql-authorization':
            opts?.headers?.['Authorization'] ??
            opts?.headers?.['authorization'] ??
            userAuthorization ??
            `Bearer ${serviceRoleKey}`,
        },
      })
    }

    return customFetcher
  }, [projectRef, jwtSecret, accessToken, serviceRoleKey])

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
