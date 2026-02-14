import { useParams } from 'common'
import { Table2 } from 'lucide-react'

import { DocSection } from './DocSection'
import CodeSnippet from '@/components/interfaces/Docs/CodeSnippet'
import Description from '@/components/interfaces/Docs/Description'
import Param from '@/components/interfaces/Docs/Param'
import Snippets from '@/components/interfaces/Docs/Snippets'
import { InlineLink } from '@/components/ui/InlineLink'
import { useCustomDomainsQuery } from '@/data/custom-domains/custom-domains-query'
import { useProjectJsonSchemaQuery } from '@/data/docs/project-json-schema-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

interface ResourceContentProps {
  apiEndpoint: string
  resourceId: string
  resources: { [key: string]: { id: string; displayName: string; camelCase: string } }
  selectedLang: 'bash' | 'js'
  showApiKey: string
  refreshDocs: () => void
}

export const ResourceContent = ({
  apiEndpoint,
  resourceId,
  resources,
  selectedLang,
  showApiKey,
  refreshDocs,
}: ResourceContentProps) => {
  const { ref } = useParams()
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })
  const { realtimeAll: realtimeEnabled } = useIsFeatureEnabled(['realtime:all'])

  const { data: jsonSchema } = useProjectJsonSchemaQuery({ projectRef: ref })
  const { paths, definitions } = jsonSchema || {}

  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}`
      : apiEndpoint

  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'
  const resourcePaths = paths?.[`/${resourceId}`]
  const resourceDefinition = definitions?.[resourceId]
  const resourceMeta = resources[resourceId]
  const description = resourceDefinition?.description || ''

  const methods = Object.keys(resourcePaths ?? {}).map((x) => x.toUpperCase())
  const properties = Object.entries(resourceDefinition?.properties ?? []).map(([id, val]: any) => ({
    ...val,
    id,
    required: resourceDefinition?.required?.includes(id),
  }))

  if (!paths || !definitions) return null

  return (
    <div className="flex flex-col flex-1">
      <DocSection
        title={
          <span className="flex items-center gap-2 text-subTitle">
            <Table2 size={16} strokeWidth={1.5} />
            {resourceId}
          </span>
        }
        content={
          <>
            <label className="font-mono text-xs uppercase text-foreground-lighter inline-block mb-2">
              Description
            </label>
            <Description
              content={description}
              metadata={{ table: resourceId }}
              onChange={refreshDocs}
            />
          </>
        }
      />

      {properties.length > 0 && (
        <div className="flex flex-col flex-1">
          {properties.map((x) => (
            <DocSection
              key={x.id}
              title={null}
              content={
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
              }
              snippets={
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
              }
            />
          ))}
        </div>
      )}

      {methods.includes('GET') && (
        <DocSection
          title="Read rows"
          content={
            <>
              <p>
                To read rows in <code>{resourceId}</code>, use the <code>select</code> method.
              </p>
              <p>
                <InlineLink href={`${DOCS_URL}/reference/javascript/select`}>Learn more</InlineLink>
              </p>
              <h4 className="text-default">Filtering</h4>
              <p>Supabase provides a wide range of filters.</p>
              <p>
                <InlineLink href={`${DOCS_URL}/reference/javascript/using-filters`}>
                  Learn more
                </InlineLink>
              </p>
            </>
          }
          snippets={
            <>
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
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readFilters(resourceId, endpoint, keyToShow)}
              />
            </>
          }
        />
      )}

      {methods.includes('POST') && (
        <DocSection
          title="Insert rows"
          content={
            <>
              <p>
                <code>insert</code> lets you insert into your tables. You can also insert in bulk
                and do UPSERT.
              </p>
              <p>
                <code>insert</code> will also return the replaced values for UPSERT.
              </p>
              <p>
                <InlineLink href={`${DOCS_URL}/reference/javascript/insert`}>Learn more</InlineLink>
              </p>
            </>
          }
          snippets={
            <>
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
            </>
          }
        />
      )}

      {methods.includes('PATCH') && (
        <DocSection
          title="Update rows"
          content={
            <>
              <p>
                <code>update</code> lets you update rows. <code>update</code> will match all rows by
                default. You can update specific rows using horizontal filters, e.g. <code>eq</code>
                , <code>lt</code>, and <code>is</code>.
              </p>
              <p>
                <code>update</code> will also return the replaced values for UPDATE.
              </p>
              <p>
                <InlineLink href={`${DOCS_URL}/reference/javascript/update`}>Learn more</InlineLink>
              </p>
            </>
          }
          snippets={
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.update(resourceId, endpoint, keyToShow)}
            />
          }
        />
      )}

      {methods.includes('DELETE') && (
        <DocSection
          title="Delete rows"
          content={
            <>
              <p>
                <code>delete</code> lets you delete rows. <code>delete</code> will match all rows by
                default, so remember to specify your filters!
              </p>
              <p>
                <InlineLink href={`${DOCS_URL}/reference/javascript/delete`}>Learn more</InlineLink>
              </p>
            </>
          }
          snippets={
            <CodeSnippet
              selectedLang={selectedLang}
              snippet={Snippets.delete(resourceId, endpoint, keyToShow)}
            />
          }
        />
      )}

      {realtimeEnabled &&
        (methods.includes('DELETE') || methods.includes('POST') || methods.includes('PATCH')) && (
          <DocSection
            title="Subscribe to changes"
            content={
              <>
                <p>
                  Supabase provides realtime functionality and broadcasts database changes to
                  authorized users depending on Row Level Security (RLS) policies.
                </p>
                <p>
                  <InlineLink href={`${DOCS_URL}/reference/javascript/subscribe`}>
                    Learn more
                  </InlineLink>
                </p>
              </>
            }
            snippets={
              <>
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
              </>
            }
          />
        )}
    </div>
  )
}
