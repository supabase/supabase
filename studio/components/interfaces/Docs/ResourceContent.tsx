import Snippets from 'components/to-be-cleaned/Docs/Snippets'
import CodeSnippet from 'components/to-be-cleaned/Docs/CodeSnippet'
import Param from 'components/to-be-cleaned/Docs/Param'
import Description from 'components/to-be-cleaned/Docs/Description'

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
      <h2 className="text-scale-1200mt-0">
        <span className="px-6 py-2 text-2xl">{resourceId}</span>
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
          {properties.map((x) => (
            <div className="doc-section py-4" key={x.id}>
              <article className="text">
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
          <h3 className="text-scale-1200 mt-4 px-6">Read rows</h3>
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
              <h4 className="mt-0 text-white">Filtering</h4>
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
          <h3 className="text-scale-1200 mt-4 px-6">Insert rows</h3>
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
          <h3 className="text-scale-1200 mt-4 px-6">Update rows</h3>
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
          <h3 className="text-scale-1200 mt-4 px-6">Delete rows</h3>
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
        <h3 className="text-scale-1200 mt-4 px-6">Subscribe to changes</h3>
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
        <h3 className="text-scale-1200 mt-4 px-6">Much more</h3>
        <div className="doc-section py-4">
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

export default ResourceContent
