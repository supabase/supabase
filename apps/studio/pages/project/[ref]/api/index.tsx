import { useParams } from 'common'
import { useState } from 'react'

import { GeneralContent, ResourceContent, RpcContent } from 'components/interfaces/Docs'
import LangSelector from 'components/interfaces/Docs/LangSelector'
import DocsLayout from 'components/layouts/DocsLayout/DocsLayout'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { snakeToCamel } from 'lib/helpers'
import type { NextPageWithLayout } from 'types'

const PageConfig: NextPageWithLayout = () => {
  return <DocView />
}

PageConfig.getLayout = (page) => <DocsLayout title="API">{page}</DocsLayout>

export default PageConfig

const DocView = () => {
  const functionPath = 'rpc/'
  const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

  const { ref: projectRef, page, resource, rpc } = useParams()
  const [selectedLang, setSelectedLang] = useState<any>('js')
  const [showApiKey, setShowApiKey] = useState<any>(DEFAULT_KEY)

  const { data: settings, error: settingsError } = useProjectSettingsV2Query({ projectRef })
  const {
    data: jsonSchema,
    error: jsonSchemaError,
    isLoading,
    refetch,
  } = useProjectJsonSchemaQuery({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })

  const refreshDocs = async () => await refetch()

  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain?.hostname}`
      : `${protocol}://${hostEndpoint ?? '-'}`

  const { paths } = jsonSchema || {}
  const PAGE_KEY: any = resource || rpc || page || 'index'

  const { resources, rpcs } = Object.entries(paths || {}).reduce(
    (a, [name]) => {
      const trimmedName = name.slice(1)
      const id = trimmedName.replace(functionPath, '')

      const displayName = id.replace(/_/g, ' ')
      const camelCase = snakeToCamel(id)
      const enriched = { id, displayName, camelCase }

      if (!trimmedName.length) {
        return a
      }

      return {
        resources: {
          ...a.resources,
          ...(!trimmedName.includes(functionPath)
            ? {
                [id]: enriched,
              }
            : {}),
        },
        rpcs: {
          ...a.rpcs,
          ...(trimmedName.includes(functionPath)
            ? {
                [id]: enriched,
              }
            : {}),
        },
      }
    },
    { resources: {}, rpcs: {} }
  )

  if (settingsError || jsonSchemaError) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <p className="text-foreground-light">
          <p>Error connecting to API</p>
          <p>{`${settingsError || jsonSchemaError}`}</p>
        </p>
      </div>
    )
  }

  if (isLoading || !settings || !jsonSchema) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <h3 className="text-xl">Building docs ...</h3>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto Docs Docs--api-page" key={PAGE_KEY}>
      <div className="Docs--inner-wrapper">
        <div className="sticky top-0 z-40 flex flex-row-reverse w-full ">
          <LangSelector
            selectedLang={selectedLang}
            showApiKey={showApiKey}
            setSelectedLang={setSelectedLang}
            setShowApiKey={setShowApiKey}
          />
        </div>
        <div>
          {resource ? (
            <ResourceContent
              apiEndpoint={endpoint}
              selectedLang={selectedLang}
              resourceId={resource}
              resources={resources}
              showApiKey={showApiKey.key}
              refreshDocs={refreshDocs}
            />
          ) : rpc ? (
            <RpcContent
              selectedLang={selectedLang}
              rpcId={rpc}
              paths={paths}
              rpcs={rpcs}
              showApiKey={showApiKey.key}
              refreshDocs={refreshDocs}
            />
          ) : (
            <GeneralContent selectedLang={selectedLang} showApiKey={showApiKey.key} page={page} />
          )}
        </div>
      </div>
    </div>
  )
}
