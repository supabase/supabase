import { useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { createGraphiQLFetcher } from '@graphiql/toolkit'

import { NextPageWithLayout } from 'types'
import { useParams, useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import ExtensionCard from 'components/interfaces/Database/Extensions/ExtensionCard'
import GraphiQL from 'components/interfaces/GraphQL/GraphiQL'
import { DocsLayout } from 'components/layouts'
import Connecting from 'components/ui/Loading/Loading'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'

const GraphiQLPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { ui, meta } = useStore()

  const isExtensionsLoading = meta.extensions.isLoading
  const pgGraphqlExtension = meta.extensions.byId('pg_graphql')
  const { data: accessToken } = useSessionAccessTokenQuery()

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      // Schemas may be needed when enabling the GraphQL extension
      meta.schemas.load()
      meta.extensions.load()
    }
  }, [ui.selectedProject?.ref])

  const graphqlUrl = `${API_URL}/projects/${projectRef}/api/graphql`

  const fetcher = useMemo(() => {
    return createGraphiQLFetcher({ url: graphqlUrl, fetch })
  }, [graphqlUrl])

  if (!accessToken || (isExtensionsLoading && !pgGraphqlExtension)) {
    return <Connecting />
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

  return <GraphiQL fetcher={fetcher} theme={ui.theme} accessToken={accessToken} />
}

GraphiQLPage.getLayout = (page) => <DocsLayout title="GraphiQL">{page}</DocsLayout>

export default observer(GraphiQLPage)
