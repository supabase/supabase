import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { GraphiQL } from 'graphiql'
import 'graphiql/graphiql.css'

import { ProjectLayoutWithAuth } from 'components/layouts'
import Connecting from 'components/ui/Loading/Loading'
import { useParams, useProjectSettings } from 'hooks'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { useMemo } from 'react'
import { NextPageWithLayout } from 'types'
import { IconAlertCircle } from 'ui'

const GraphiQLPage: NextPageWithLayout = () => {
  const { ref } = useParams()

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

  if (isProjectSettingsLoading) {
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

  return <GraphiQL fetcher={fetcher} />
}

GraphiQLPage.getLayout = (page) => (
  <ProjectLayoutWithAuth title="GraphiQL">{page}</ProjectLayoutWithAuth>
)

export default GraphiQLPage
