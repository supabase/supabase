import { useParams } from 'common'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'

import { GeneralContent, ResourceContent, RpcContent } from 'components/interfaces/Docs'
import LangSelector from 'components/interfaces/Docs/LangSelector'
import { DocsLayout } from 'components/layouts'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { snakeToCamel } from 'lib/helpers'
import { NextPageWithLayout } from 'types'

const PageContext = createContext(null)

const PageConfig: NextPageWithLayout = () => {
  const PageState: any = useLocalObservable(() => ({
    projectRef: '',
    jsonSchema: {},
    resources: {},
    rpcs: {},
    setJsonSchema(value: any) {
      const { paths } = value || {}
      const functionPath = 'rpc/'
      let resources: any = {}
      let rpcs: any = {}

      Object.entries(paths || []).forEach(([name, val]) => {
        let trimmed = name.slice(1)
        let id = trimmed.replace(functionPath, '')
        let displayName = id.replace(/_/g, ' ')
        let camelCase = snakeToCamel(id)
        let enriched = { id, displayName, camelCase }
        if (!trimmed.length) return
        else if (trimmed.includes(functionPath)) rpcs[id] = enriched
        else resources[id] = enriched
      })

      PageState.jsonSchema = value
      PageState.resources = resources
      PageState.rpcs = rpcs
    },
  }))

  const router = useRouter()
  const { query } = router
  PageState.projectRef = query.ref

  return (
    <PageContext.Provider value={PageState}>
      <DocView />
    </PageContext.Provider>
  )
}

PageConfig.getLayout = (page) => <DocsLayout title="API">{page}</DocsLayout>

export default observer(PageConfig)

const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

const DocView = observer(() => {
  const PageState: any = useContext(PageContext)
  const { ref: projectRef, page, resource, rpc } = useParams()
  const [selectedLang, setSelectedLang] = useState<any>('js')
  const [showApiKey, setShowApiKey] = useState<any>(DEFAULT_KEY)

  const { data, error } = useProjectApiQuery({
    projectRef,
  })

  const apiService = data?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : undefined

  const {
    data: jsonSchema,
    error: jsonSchemaError,
    refetch,
  } = useProjectJsonSchemaQuery({ projectRef })

  useEffect(() => {
    PageState.setJsonSchema(jsonSchema)
  }, [jsonSchema])

  const refreshDocs = async () => {
    await refetch()
  }

  if (error || jsonSchemaError)
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <p className="text-foreground-light">
          <p>Error connecting to API</p>
          <p>{`${error || jsonSchemaError}`}</p>
        </p>
      </div>
    )
  if (!data || !jsonSchema || !PageState.jsonSchema)
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <h3 className="text-xl">Building docs ...</h3>
      </div>
    )

  // Data Loaded
  const autoApiService = {
    ...data.autoApiService,
    endpoint: `${data.autoApiService.protocol ?? 'https'}://${data.autoApiService.endpoint ?? '-'}`,
  }

  const { paths, definitions } = PageState.jsonSchema

  const PAGE_KEY: any = resource || rpc || page || 'index'

  return (
    <div className="w-full h-full overflow-y-auto Docs Docs--api-page" key={PAGE_KEY}>
      <div className="Docs--inner-wrapper">
        <div className="sticky top-0 z-40 flex flex-row-reverse w-full ">
          <LangSelector
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
            apiKey={anonKey}
            autoApiService={autoApiService}
          />
        </div>
        <div className="">
          {resource ? (
            <ResourceContent
              autoApiService={autoApiService}
              selectedLang={selectedLang}
              resourceId={resource}
              resources={PageState.resources}
              definitions={definitions}
              paths={paths}
              showApiKey={showApiKey.key}
              refreshDocs={refreshDocs}
            />
          ) : rpc ? (
            <RpcContent
              autoApiService={autoApiService}
              selectedLang={selectedLang}
              rpcId={rpc}
              paths={paths}
              rpcs={PageState.rpcs}
              showApiKey={showApiKey.key}
              refreshDocs={refreshDocs}
            />
          ) : (
            <GeneralContent
              autoApiService={autoApiService}
              selectedLang={selectedLang}
              showApiKey={showApiKey.key}
              page={page}
            />
          )}
        </div>
      </div>
    </div>
  )
})
