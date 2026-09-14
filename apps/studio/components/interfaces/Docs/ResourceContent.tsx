import { useParams } from 'common'
import { Table2 } from 'lucide-react'

import { DocSection } from './DocSection'
import Snippets, { getSchemaQualifiedEntity } from './Snippets'
import CodeSnippet from '@/components/interfaces/Docs/CodeSnippet'
import Description from '@/components/interfaces/Docs/Description'
import Param from '@/components/interfaces/Docs/Param'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import {
  ProjectJsonSchemaDefinitions,
  ProjectJsonSchemaPaths,
} from '@/data/docs/project-json-schema-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

interface ResourceContentProps {
  resourceId: string
  resources: { [key: string]: { id: string; displayName: string; camelCase: string } }
  definitions: ProjectJsonSchemaDefinitions
  paths: ProjectJsonSchemaPaths
  selectedLang: 'bash' | 'js'
  showApiKey: string
  refreshDocs: () => void
}

export const ResourceContent = ({
  resourceId,
  resources,
  definitions,
  paths,
  selectedLang,
  showApiKey,
  refreshDocs,
}: ResourceContentProps) => {
  const { ref } = useParams()
  const { realtimeAll: realtimeEnabled } = useIsFeatureEnabled(['realtime:all'])

  const { data: endpoint = '' } = useProjectApiUrl({ projectRef: ref })

  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'
  const resourceMeta = resources[resourceId]
  const { name: resourceName, schema: resourceSchema } = getSchemaQualifiedEntity(resourceId)
  const resourcePaths = paths?.[`/${resourceId}`]
  const resourceDefinition = definitions?.[resourceId]
  const description = resourceDefinition?.description || ''

  const methods = Object.keys(resourcePaths ?? {}).map((x) => x.toUpperCase())
  const properties = Object.entries(resourceDefinition?.properties ?? []).map(([id, val]: any) => ({
    ...val,
    id,
    required: resourceDefinition?.required?.includes(id),
  }))
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
                    resourceId: resourceName,
                    endpoint: endpoint,
                    apiKey: keyToShow,
                    columnName: x.id,
                    schema: resourceSchema,
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
                snippet={Snippets.readAll(resourceName, endpoint, keyToShow, resourceSchema)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readColumns({
                  resourceId: resourceName,
                  endpoint: endpoint,
                  apiKey: keyToShow,
                  schema: resourceSchema,
                })}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readForeignTables(
                  resourceName,
                  endpoint,
                  keyToShow,
                  resourceSchema
                )}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readRange(resourceName, endpoint, keyToShow, resourceSchema)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readFilters(resourceName, endpoint, keyToShow, resourceSchema)}
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
                snippet={Snippets.insertSingle(resourceName, endpoint, keyToShow, resourceSchema)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.insertMany(resourceName, endpoint, keyToShow, resourceSchema)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.upsert(resourceName, endpoint, keyToShow, resourceSchema)}
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
              snippet={Snippets.update(resourceName, endpoint, keyToShow, resourceSchema)}
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
              snippet={Snippets.delete(resourceName, endpoint, keyToShow, resourceSchema)}
            />
          }
        />
      )}

      {resourceMeta &&
        realtimeEnabled &&
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
                  snippet={Snippets.subscribeAll(
                    resourceMeta.camelCase,
                    resourceName,
                    resourceSchema
                  )}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeInserts(
                    resourceMeta.camelCase,
                    resourceName,
                    resourceSchema
                  )}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeUpdates(
                    resourceMeta.camelCase,
                    resourceName,
                    resourceSchema
                  )}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeDeletes(
                    resourceMeta.camelCase,
                    resourceName,
                    resourceSchema
                  )}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeEq(
                    resourceMeta.camelCase,
                    resourceName,
                    'column_name',
                    'someValue',
                    resourceSchema
                  )}
                />
              </>
            }
          />
        )}
    </div>
  )
}
