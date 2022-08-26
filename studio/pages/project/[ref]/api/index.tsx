import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/router'
import { Button, Dropdown, IconKey, Typography } from '@supabase/ui'
import { FC, createContext, useContext, useEffect, useState } from 'react'
import { observer, useLocalObservable } from 'mobx-react-lite'

import { NextPageWithLayout } from 'types'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { snakeToCamel } from 'lib/helpers'
import { DocsLayout } from 'components/layouts'
import { GeneralContent, ResourceContent, RpcContent } from 'components/interfaces/Docs'

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

  const { ui } = useStore()
  const project = ui.selectedProject
  PageState.projectRef = query.ref

  return (
    <PageContext.Provider value={PageState}>
      <DocView project={project} />
    </PageContext.Provider>
  )
}

PageConfig.getLayout = (page) => <DocsLayout title="API">{page}</DocsLayout>

export default observer(PageConfig)

const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

const DocView: FC<any> = observer(({}) => {
  const PageState: any = useContext(PageContext)
  const router = useRouter()
  const [selectedLang, setSelectedLang] = useState<any>('js')
  const [showApiKey, setShowApiKey] = useState<any>(DEFAULT_KEY)

  const { data, error }: any = useSWR(`${API_URL}/props/project/${PageState.projectRef}/api`, get)
  const API_KEY = data?.autoApiService?.serviceApiKey
  const swaggerUrl = data?.autoApiService?.restUrl
  const headers: any = { apikey: API_KEY }

  if (API_KEY?.length > 40) headers['Authorization'] = `Bearer ${API_KEY}`

  const { data: jsonSchema, error: jsonSchemaError } = useSWR(
    () => swaggerUrl,
    (url: string) => get(url, { headers, credentials: 'omit' }).then((res) => res)
  )

  useEffect(() => {
    PageState.setJsonSchema(jsonSchema)
  }, [jsonSchema])

  const refreshDocs = async () => {
    // A bit hacky calling coding this up twice - at some point we should move this function
    // and the SWR into the store.
    mutate(swaggerUrl)
  }

  if (error || jsonSchemaError)
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <Typography.Text type="danger">
          <p>Error connecting to API</p>
          <p>{`${error || jsonSchemaError}`}</p>
        </Typography.Text>
      </div>
    )
  if (!data || !jsonSchema || !PageState.jsonSchema)
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <Typography.Title level={3}>Building docs ...</Typography.Title>
      </div>
    )

  // Data Loaded
  const autoApiService = {
    ...data.autoApiService,
    endpoint: IS_PLATFORM
      ? `https://${data?.autoApiService?.endpoint}`
      : data.autoApiService.endpoint,
  }

  const { query } = router
  const { page, resource, rpc } = query
  const { paths, definitions } = PageState.jsonSchema

  const PAGE_KEY: any = resource || rpc || page || 'index'

  return (
    <div className="Docs h-full w-full overflow-y-auto" key={PAGE_KEY}>
      <div className="Docs--inner-wrapper">
        <div className="sticky top-0 z-40 flex w-full flex-row-reverse ">
          <div className="bg-scale-100 dark:bg-scale-300" style={{ width: '50%' }}>
            <div className="z-0 flex ">
              <button
                type="button"
                onClick={() => setSelectedLang('js')}
                className={`${
                  selectedLang == 'js'
                    ? 'text-scale-1200 bg-scale-300 dark:bg-scale-200 font-medium'
                    : 'text-scale-900 bg-scale-100 dark:bg-scale-100'
                } border-scale-200 hover:text-scale-1200 relative inline-flex items-center border-r p-1 px-2 text-sm transition focus:outline-none`}
              >
                JavaScript
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang('bash')}
                className={`${
                  selectedLang == 'bash'
                    ? 'text-scale-1200 bg-scale-300 dark:bg-scale-200 font-medium'
                    : 'text-scale-900 bg-scale-100 dark:bg-scale-100'
                } border-scale-200 hover:text-scale-1200 relative inline-flex items-center border-r p-1 px-2 text-sm transition focus:outline-none`}
              >
                Bash
              </button>
              {selectedLang == 'bash' && (
                <div className="flex">
                  <div className="text-scale-900 flex items-center gap-2 p-1 pl-2 text-xs">
                    <IconKey size={12} strokeWidth={1.5} />
                    <span>Project API key :</span>
                  </div>
                  <Dropdown
                    align="end"
                    side="bottom"
                    className="text-scale-900 cursor-pointer border-none bg-transparent p-0 pl-2 pr-8 text-sm"
                    overlay={
                      <>
                        <Dropdown.Item onClick={() => setShowApiKey(DEFAULT_KEY)}>
                          hide
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            setShowApiKey({
                              key: autoApiService?.defaultApiKey,
                              name: 'anon (public)',
                            })
                          }
                        >
                          anon (public)
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            setShowApiKey({
                              key: autoApiService?.serviceApiKey,
                              name: 'service_role (secret)',
                            })
                          }
                        >
                          service_role (secret)
                        </Dropdown.Item>
                      </>
                    }
                  >
                    <Button type="default">{showApiKey.name}</Button>
                  </Dropdown>
                </div>
              )}
            </div>
          </div>
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
