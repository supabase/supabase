import { observer } from 'mobx-react-lite'
import { createGraphiQLFetcher } from '@graphiql/toolkit'

import ExtensionCard from 'components/interfaces/Database/Extensions/ExtensionCard'
import GraphiQL from 'components/interfaces/GraphQL/GraphiQL'
import { DocsLayout } from 'components/layouts'
import Connecting from 'components/ui/Loading/Loading'
import { useParams, useStore } from 'hooks'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useEffect, useMemo } from 'react'
import { NextPageWithLayout } from 'types'
import { IconAlertCircle } from 'ui'

const GraphiQLPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
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
    data: settings,
    isError: isProjectSettingsError,
    isLoading: isProjectSettingsLoading,
  } = useProjectApiQuery({
    projectRef,
  })

  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : undefined
  const endpoint = settings?.autoApiService.app_config.endpoint ?? ''

  const graphqlUrl = `https://${endpoint}/graphql/v1`

  const fetcher = useMemo(() => {
    return createGraphiQLFetcher({
      url: graphqlUrl,
      fetch,
    })
  }, [graphqlUrl])

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
              Toggle the switch below to enable the GraphQL extension. You can then use the GraphQL
              API with your Supabase Database.
            </h2>
          </div>

          <ExtensionCard extension={pgGraphqlExtension} />
        </div>
      </div>
    )
  }

  return <GraphiQL fetcher={fetcher} theme={ui.theme} apiKey={anonKey} />
}

GraphiQLPage.getLayout = (page) => <DocsLayout title="GraphiQL">{page}</DocsLayout>

export default observer(GraphiQLPage)
