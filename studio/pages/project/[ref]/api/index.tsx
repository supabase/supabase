import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/router'
import { Button, Dropdown, IconKey } from 'ui'
import { FC, createContext, useContext, useEffect, useState } from 'react'
import { observer, useLocalObservable } from 'mobx-react-lite'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { snakeToCamel } from 'lib/helpers'
import { DocsLayout } from 'components/layouts'
import { GeneralContent, ResourceContent, RpcContent } from 'components/interfaces/Docs'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'

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

  const { data, error } = useProjectSettingsQuery({ projectRef: PageState.projectRef as string })
  const API_KEY = data?.autoApiService.service_api_keys.find((key: any) => key.tags === 'anon')
    ? data.autoApiService.defaultApiKey
    : undefined
  const swaggerUrl = data?.autoApiService.restUrl
  const headers: any = { apikey: API_KEY }

  const canReadServiceKey = checkPermissions(
    PermissionAction.READ,
    'service_api_keys.service_role_key'
  )

  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

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
        <p className="text-scale-1000">
          <p>Error connecting to API</p>
          <p>{`${error || jsonSchemaError}`}</p>
        </p>
      </div>
    )
  if (!data || !jsonSchema || !PageState.jsonSchema)
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <h3 className="text-xl">Building docs ...</h3>
      </div>
    )

  // Data Loaded
  const autoApiService = {
    ...data.autoApiService,
    endpoint: `${data.autoApiService.protocol ?? 'https'}://${data.autoApiService.endpoint ?? '-'}`,
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
                    ? 'bg-scale-300 font-medium text-scale-1200 dark:bg-scale-200'
                    : 'bg-scale-100 text-scale-900 dark:bg-scale-100'
                } relative inline-flex items-center border-r border-scale-200 p-1 px-2 text-sm transition hover:text-scale-1200 focus:outline-none`}
              >
                JavaScript
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang('bash')}
                className={`${
                  selectedLang == 'bash'
                    ? 'bg-scale-300 font-medium text-scale-1200 dark:bg-scale-200'
                    : 'bg-scale-100 text-scale-900 dark:bg-scale-100'
                } relative inline-flex items-center border-r border-scale-200 p-1 px-2 text-sm transition hover:text-scale-1200 focus:outline-none`}
              >
                Bash
              </button>
              {selectedLang == 'bash' && (
                <div className="flex">
                  <div className="flex items-center gap-2 p-1 pl-2 text-xs text-scale-900">
                    <IconKey size={12} strokeWidth={1.5} />
                    <span>Project API key :</span>
                  </div>
                  <Dropdown
                    align="end"
                    side="bottom"
                    className="cursor-pointer border-none bg-transparent p-0 pl-2 pr-8 text-sm text-scale-900"
                    overlay={
                      <>
                        <Dropdown.Item key="hide" onClick={() => setShowApiKey(DEFAULT_KEY)}>
                          hide
                        </Dropdown.Item>
                        <Dropdown.Item
                          key="anon"
                          onClick={() =>
                            setShowApiKey({
                              key: API_KEY,
                              name: 'anon (public)',
                            })
                          }
                        >
                          anon (public)
                        </Dropdown.Item>
                        {canReadServiceKey && (
                          <Dropdown.Item
                            key="service"
                            onClick={() =>
                              setShowApiKey({
                                key: autoApiService.serviceApiKey,
                                name: 'service_role (secret)',
                              })
                            }
                          >
                            service_role (secret)
                          </Dropdown.Item>
                        )}
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
