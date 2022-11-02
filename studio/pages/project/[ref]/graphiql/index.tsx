import { observer } from 'mobx-react-lite'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { GraphiQL } from 'graphiql'
import 'graphiql/graphiql.css'

import ExtensionCard from 'components/interfaces/Database/Extensions/ExtensionCard'
import { ProjectLayoutWithAuth } from 'components/layouts'
import Connecting from 'components/ui/Loading/Loading'
import { useParams, useProjectSettings, useStore } from 'hooks'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { useEffect, useMemo } from 'react'
import { NextPageWithLayout } from 'types'
import { IconAlertCircle } from 'ui'

const GraphiQLPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { ui, meta } = useStore()

  const isExtensionsLoading = meta.extensions.isLoading
  const pgGraphqlExtension = meta.extensions.byId('pg_graphql')

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      // Schemas may be needed when enabling the GraphQL extension
      meta.schemas.load()
      meta.extensions.load()
    }
  }, [ui.selectedProject?.ref])

  const {
    services,
    isError: isProjectSettingsError,
    isLoading: isProjectSettingsLoading,
  } = useProjectSettings(ref)

  const apiService = (services ?? []).find((x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID)
  const apiConfig = apiService?.app_config ?? {}
  const apiKeys = apiService?.service_api_keys ?? []

  const graphqlUrl = `https://${apiConfig.endpoint}/graphql/v1`
  const anonKey = apiKeys.find((key: any) => key.tags === 'anon')?.api_key

  const fetcher = useMemo(() => {
    return createGraphiQLFetcher({
      url: graphqlUrl,
      fetch,
      headers: {
        apikey: anonKey,
      },
    })
  }, [graphqlUrl, anonKey])

  if (isProjectSettingsLoading || (isExtensionsLoading && !pgGraphqlExtension)) {
    return <Connecting />
  }

  if (isProjectSettingsError) {
    return (
      <div className="py-8 flex items-center justify-center space-x-2">
        <IconAlertCircle size={16} strokeWidth={1.5} />
        <p className="text-sm text-scale-1100">Failed to retrieve API keys</p>
      </div>
    )
  }

  if (pgGraphqlExtension?.installed_version === null) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full">
          <div className="mb-6">
            <h1 className="text-2xl mt-8 mb-2">Enable the GraphQL Extension</h1>
            <h2 className="text-scale-1100 text-sm">
              Toggle the switch below to enable the GraphQL extension. Then you can use the GraphQL
              API with your Supabase Database.
            </h2>
          </div>

          <ExtensionCard extension={pgGraphqlExtension} />
        </div>
      </div>
    )
  }

  return <GraphiQL fetcher={fetcher} />
}

GraphiQLPage.getLayout = (page) => (
  <ProjectLayoutWithAuth title="GraphiQL">{page}</ProjectLayoutWithAuth>
)

export default observer(GraphiQLPage)
