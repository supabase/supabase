import { useParams } from 'common'
import { IconTable } from 'ui'

import CodeSnippet from 'components/interfaces/Docs/CodeSnippet'
import Description from 'components/interfaces/Docs/Description'
import Param from 'components/interfaces/Docs/Param'
import Snippets from 'components/interfaces/Docs/Snippets'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useIsFeatureEnabled } from 'hooks'

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
  const { ref } = useParams()
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })
  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}`
      : autoApiService.endpoint

  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'
  const resourcePaths = paths[`/${resourceId}`]
  const resourceDefinition = definitions[resourceId]
  const resourceMeta = resources[resourceId]
  const description = resourceDefinition?.description || null
  const methods = Object.keys(resourcePaths).map((x) => x.toUpperCase())
  const properties = Object.entries(resourceDefinition.properties || []).map(([id, val]: any) => ({
    ...val,
    id,
    required: resourceDefinition?.required?.includes(id),
  }))

  const { realtimeAll: realtimeEnabled } = useIsFeatureEnabled(['realtime:all'])

  if (!paths || !definitions) return null

  return (
    <>
      <h2 className="doc-section__table-name text-foreground mt-0 flex items-center px-6 gap-2">
        <span className="bg-slate-300 dark:bg-slate-400 p-2 rounded-lg">
          <IconTable size="small" />
        </span>
        <span className="text-2xl font-bold">{resourceId}</span>
      </h2>

      <div className="doc-section">
        <article className="code-column text-foreground">
          <label className="font-mono text-xs uppercase text-foreground-lighter inline-block mb-2">
            Description
          </label>
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
          {properties.map((x) => (
            <div className="doc-section py-4" key={x.id}>
              <div className="code-column text-foreground">
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
              </div>
              <div className="code">
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.readColumns({
                    title: `Select ${x.id}`,
                    resourceId,
                    endpoint: endpoint,
                    apiKey: keyToShow,
                    columnName: x.id,
                  })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {methods.includes('GET') && (
        <>
          <h3 className="text-foreground mt-4 px-6">Read rows</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                To read rows in <code>{resourceId}</code>, use the <code>select</code> method.
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/select"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn more
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readAll(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readColumns({
                  resourceId,
                  endpoint: endpoint,
                  apiKey: keyToShow,
                })}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readForeignTables(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readRange(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <h4 className="mt-0 text-white">Filtering</h4>
              <p>Supabase provides a wide range of filters.</p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/using-filters"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn more
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readFilters(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('POST') && (
        <>
          <h3 className="text-foreground mt-4 px-6">Insert rows</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                <code>insert</code> lets you insert into your tables. You can also insert in bulk
                and do UPSERT.
              </p>
              <p>
                <code>insert</code> will also return the replaced values for UPSERT.
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/insert"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn more
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.insertSingle(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.insertMany(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.upsert(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('PATCH') && (
        <>
          <h3 className="text-foreground mt-4 px-6">Update rows</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                <code>update</code> lets you update rows. <code>update</code> will match all rows by
                default. You can update specific rows using horizontal filters, e.g. <code>eq</code>
                , <code>lt</code>, and <code>is</code>.
              </p>
              <p>
                <code>update</code> will also return the replaced values for UPDATE.
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/update"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn more
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.update(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('DELETE') && (
        <>
          <h3 className="text-foreground mt-4 px-6">Delete rows</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                <code>delete</code> lets you delete rows. <code>delete</code> will match all rows by
                default, so remember to specify your filters!
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/delete"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn more
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.delete(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {realtimeEnabled &&
        (methods.includes('DELETE') || methods.includes('POST') || methods.includes('PATCH')) && (
          <>
            <h3 className="text-foreground mt-4 px-6">Subscribe to changes</h3>
            <div className="doc-section">
              <article className="code-column text-foreground">
                <p>
                  Supabase provides realtime functionality and broadcasts database changes to
                  authorized users depending on Row Level Security (RLS) policies.
                </p>
                <p>
                  <a
                    href="https://supabase.com/docs/reference/javascript/subscribe"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Learn more
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
        )}
    </>
  )
}

export default ResourceContent
