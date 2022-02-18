import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/router'
import { Typography } from '@supabase/ui'
import { FC, createContext, useContext, useEffect, useState } from 'react'
import { observer, useLocalObservable } from 'mobx-react-lite'

import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import { get } from 'lib/common/fetch'
import { snakeToCamel } from 'lib/helpers'
import { DocsLayout } from 'components/layouts'
import Snippets from 'components/to-be-cleaned/Docs/Snippets'
import CodeSnippet from 'components/to-be-cleaned/Docs/CodeSnippet'
import Param from 'components/to-be-cleaned/Docs/Param'
import Introduction from 'components/to-be-cleaned/Docs/Pages/Introduction'
import Authentication from 'components/to-be-cleaned/Docs/Pages/Authentication'
import TablesIntroduction from 'components/to-be-cleaned/Docs/Pages/Tables/Introduction'
import UserManagement from 'components/to-be-cleaned/Docs/Pages/UserManagement'
import RpcIntroduction from 'components/to-be-cleaned/Docs/Pages/Rpc/Introduction'
import Description from 'components/to-be-cleaned/Docs/Description'

const PageContext = createContext(null)

const PageConfig = () => {
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
        let trimmed = name.substr(1)
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
      <DocsLayout title="API">
        <DocView project={project} />
      </DocsLayout>
    </PageContext.Provider>
  )
}
export default withAuth(observer(PageConfig))

const DocView: FC<any> = observer(({}) => {
  const PageState: any = useContext(PageContext)
  const router = useRouter()
  const [selectedLang, setSelectedLang] = useState<any>('js')
  const [showApiKey, setShowApiKey] = useState<any>('')

  const { data, error }: any = useSWR(`${API_URL}/props/project/${PageState.projectRef}/api`, get)
  const API_KEY = data?.autoApiService?.internalApiKey
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
      <div className="p-6 mx-auto sm:w-full md:w-3/4 text-center">
        <Typography.Text type="danger">
          <p>Error connecting to API</p>
          <p>{`${error || jsonSchemaError}`}</p>
        </Typography.Text>
      </div>
    )
  if (!data || !jsonSchema || !PageState.jsonSchema)
    return (
      <div className="p-6 mx-auto sm:w-full md:w-3/4 text-center">
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
        <div className="sticky top-0 w-full flex flex-row-reverse z-40 ">
          <div
            className="border-b border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700"
            style={{ width: '50%' }}
          >
            <div className="z-0 flex ">
              <button
                type="button"
                onClick={() => setSelectedLang('js')}
                className={`${
                  selectedLang == 'js'
                    ? 'text-gray-600 dark:text-gray-300'
                    : 'text-gray-300 dark:text-gray-400'
                } relative inline-flex items-center p-1 px-2 bg-coolGray-100 dark:bg-gray-600 border-r border-gray-200 dark:border-gray-500 text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 focus:z-10 focus:outline-none focus:border-blue-300 focus:ring-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150`}
              >
                JavaScript
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang('bash')}
                className={`${
                  selectedLang == 'bash'
                    ? 'text-gray-600 dark:text-gray-300'
                    : 'text-gray-300 dark:text-gray-400'
                } relative inline-flex items-center p-1 px-2 bg-coolGray-100 dark:bg-gray-600 border-r border-gray-200 dark:border-gray-500 text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 focus:z-10 focus:outline-none focus:border-blue-300 focus:ring-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150`}
              >
                Bash
              </button>
              {selectedLang == 'bash' && (
                <div className="flex">
                  <span className="text-sm text-gray-600 dark:text-gray-300 p-1 pl-2">Key:</span>
                  <select
                    className="text-sm text-gray-600 dark:text-gray-300 border-none cursor-pointer p-0 pl-2 pr-8"
                    value={showApiKey}
                    onChange={(e) => setShowApiKey(e.target.value)}
                  >
                    <option value="">Hide</option>
                    <option value={autoApiService?.defaultApiKey}>{'anon key'}</option>
                    <option value={autoApiService?.serviceApiKey}>{'service key'}</option>
                  </select>
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
              showApiKey={showApiKey}
              refreshDocs={refreshDocs}
            />
          ) : rpc ? (
            <RpcContent
              autoApiService={autoApiService}
              selectedLang={selectedLang}
              rpcId={rpc}
              paths={paths}
              rpcs={PageState.rpcs}
              showApiKey={showApiKey}
              refreshDocs={refreshDocs}
            />
          ) : (
            <GeneralContent
              autoApiService={autoApiService}
              selectedLang={selectedLang}
              showApiKey={showApiKey}
              page={page}
            />
          )}
        </div>
      </div>
    </div>
  )
})

const GeneralContent = ({ autoApiService, selectedLang, page, showApiKey }: any) => {
  let selected = page?.toLowerCase()
  if (selected == 'intro' || selected == null)
    return <Introduction autoApiService={autoApiService} selectedLang={selectedLang} />
  if (selected == 'auth')
    return <Authentication autoApiService={autoApiService} selectedLang={selectedLang} />
  if (selected == 'users')
    return (
      <UserManagement
        autoApiService={autoApiService}
        selectedLang={selectedLang}
        showApiKey={showApiKey}
      />
    )
  if (selected == 'tables-intro')
    return <TablesIntroduction autoApiService={autoApiService} selectedLang={selectedLang} />
  if (selected == 'rpc-intro') return <RpcIntroduction />
  else
    return (
      <div>
        <h2 className="m-4">Not found</h2>
        <p className="m-4"> Looks like you went somewhere that nobody knows.</p>
      </div>
    )
}

/**
 * TODO: need to support rpc with the same name and different params type
 */
const RpcContent = ({
  autoApiService,
  rpcId,
  rpcs,
  paths,
  selectedLang,
  refreshDocs,
  showApiKey,
}: any) => {
  const meta = rpcs[rpcId]
  const pathKey = `/rpc/${rpcId}`
  const path = paths && pathKey in paths ? paths[pathKey] : undefined
  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'

  if (!path) return null

  const {
    post: { parameters, summary },
  } = path
  const rpcParamsObject =
    parameters && parameters[0] && parameters[0].schema && parameters[0].schema.properties
      ? parameters[0].schema.properties
      : {}
  const rpcParams = Object.entries(rpcParamsObject)
    .map(([k, v]: any) => ({ name: k, ...v }))
    .filter((x) => !!x.name)
  const paramList = rpcParams.map((x) => x.type).join(', ')
  return (
    <>
      <h2 className="text-white mt-0">
        <code className="text-lg px-4 py-2">{meta.id}</code>
      </h2>

      <div className="doc-section">
        <article className="text ">
          <Description
            content={summary}
            metadata={{ rpc: `${rpcId} (${paramList})` }}
            onChange={refreshDocs}
          />
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.rpcSingle({
              rpcName: rpcId,
              // @ts-ignore
              rpcCamelCase: meta.camelCase,
              rpcParams: rpcParams,
              apiKey: keyToShow,
              endpoint: autoApiService.endpoint,
            })}
          />
        </article>
      </div>
      {rpcParams.length > 0 && (
        <div>
          <h2 className="text-white capitalize mt-0">Function Arguments</h2>
          {rpcParams.map((x) => {
            return (
              <div className="doc-section">
                <article className="text ">
                  <Param
                    key={x.name}
                    name={x.name}
                    type={x.type}
                    format={x.format}
                    required={true}
                    description={false}
                  />
                </article>
                <article className="code"></article>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

const ResourceContent = ({
  autoApiService,
  resourceId,
  resources,
  definitions,
  paths,
  selectedLang,
  showApiKey,
  refreshDocs,
}: any) => {
  if (!paths || !definitions) return null

  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'
  const resourcePaths = paths[`/${resourceId}`]
  const resourceDefinition = definitions[resourceId]
  const resourceMeta = resources[resourceId]
  const description = resourceDefinition.description || null
  const methods = Object.keys(resourcePaths).map((x) => x.toUpperCase())
  const properties = Object.entries(resourceDefinition.properties || []).map(([id, val]: any) => ({
    ...val,
    id,
    required: resourceDefinition?.required?.includes(id),
  }))

  return (
    <>
      <h2 className="text-black dark:text-white mt-0">
        <code className="text-lg px-4 py-2">{resourceId}</code>
      </h2>

      <div className="doc-section">
        <article className="text ">
          <Description
            content={description}
            metadata={{ table: resourceId }}
            onChange={refreshDocs}
          />
        </article>
        <article className="code"></article>
      </div>
      {properties.length > 0 && (
        <div>
          <h2 className="text-white capitalize mt-0">Fields</h2>
          {properties.map((x) => (
            <div className="doc-section" key={x.id}>
              <article className="text ">
                <Param
                  key={x.id}
                  name={x.id}
                  type={x.type}
                  format={x.format}
                  required={x.required}
                  description={x.description}
                  metadata={{
                    table: resourceId,
                    column: x.id,
                  }}
                  onDesciptionUpdated={refreshDocs}
                />
              </article>
              <article className="code">
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.readColumns({
                    title: `Select ${x.id}`,
                    resourceId,
                    endpoint: autoApiService.endpoint,
                    apiKey: keyToShow,
                    columnName: x.id,
                  })}
                />
              </article>
            </div>
          ))}
        </div>
      )}
      {methods.includes('GET') && (
        <>
          <h2 className="text-white mt-0">Read rows</h2>
          <div className="doc-section">
            <article className="text ">
              <p>
                To read rows in <code>{resourceId}</code>, use the <code>select</code> method.
              </p>
              <p>
                <a href="https://supabase.com/docs/client/select" target="_blank">
                  Learn more.
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readAll(resourceId, autoApiService.endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readColumns({
                  resourceId,
                  endpoint: autoApiService.endpoint,
                  apiKey: keyToShow,
                })}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readForeignTables(resourceId, autoApiService.endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readRange(resourceId, autoApiService.endpoint, keyToShow)}
              />
            </article>
          </div>
          <div className="doc-section">
            <article className="text ">
              <h4 className="text-white mt-0">Filtering</h4>
              <p>Supabase provides a wide range of filters.</p>
              <p>
                <a href="https://supabase.com/docs/client/using-filters" target="_blank">
                  Learn more.
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readFilters(resourceId, autoApiService.endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('POST') && (
        <>
          <h2 className="text-white mt-0">Insert rows</h2>
          <div className="doc-section">
            <article className="text ">
              <p>
                <code>insert</code> lets you insert into your tables. You can also insert in bulk
                and do UPSERT.
              </p>
              <p>
                <code>insert</code> will also return the replaced values for UPSERT.
              </p>
              <p>
                <a href="https://supabase.com/docs/client/insert" target="_blank">
                  Learn more.
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.insertSingle(resourceId, autoApiService.endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.insertMany(resourceId, autoApiService.endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.upsert(resourceId, autoApiService.endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('PATCH') && (
        <>
          <h2 className="text-white mt-0">Update rows</h2>
          <div className="doc-section">
            <article className="text ">
              <p>
                <code>update</code> lets you update rows. <code>update</code> will match all rows by
                default. You can update specific rows using horizontal filters, e.g. <code>eq</code>
                , <code>lt</code>, and <code>is</code>.
              </p>
              <p>
                <code>update</code> will also return the replaced values for UPDATE.
              </p>
              <p>
                <a href="https://supabase.com/docs/client/update" target="_blank">
                  Learn more.
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.update(resourceId, autoApiService.endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('DELETE') && (
        <>
          <h2 className="text-white mt-0">Delete rows</h2>
          <div className="doc-section">
            <article className="text ">
              <p>
                <code>delete</code> lets you delete rows. <code>delete</code> will match all rows by
                default, so remember to specify your filters!
              </p>
              <p>
                <a href="https://supabase.com/docs/client/delete" target="_blank">
                  Learn more.
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.delete(resourceId, autoApiService.endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      <>
        <h2 className="text-white mt-0">Subscribe to changes</h2>
        <div className="doc-section">
          <article className="text ">
            <p>
              Supabase provides realtime functionality and broadcasts database changes to authorized
              users depending on Row Level Security (RLS) policies.
            </p>
            <p>
              <a href="https://supabase.com/docs/client/subscribe" target="_blank">
                Learn more.
              </a>
            </p>
          </article>
          <article className="code">
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.subscribeAll(resourceMeta.camelCase, resourceId)}
            />
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.subscribeInserts(resourceMeta.camelCase, resourceId)}
            />
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.subscribeUpdates(resourceMeta.camelCase, resourceId)}
            />
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.subscribeDeletes(resourceMeta.camelCase, resourceId)}
            />
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.subscribeEq(
                resourceMeta.camelCase,
                resourceId,
                'column_name',
                'someValue'
              )}
            />
          </article>
        </div>
      </>
      <>
        <h2 className="text-white mt-0">Much more</h2>
        <div className="doc-section">
          <article className="text ">
            <p>
              These docs are a work in progress! See our{' '}
              <a href="https://supabase.com/docs/" target="_blank">
                docs
              </a>{' '}
              for the additional functionality Supabase has to offer.
            </p>
          </article>
          <article className="code"></article>
        </div>
      </>
    </>
  )
}
