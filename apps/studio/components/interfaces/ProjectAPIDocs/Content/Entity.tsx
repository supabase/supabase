import { useParams } from 'common'
import { useEffect } from 'react'

import Table from 'components/to-be-cleaned/Table'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { useAppStateSnapshot } from 'state/app-state'
import LanguageSelector from '../LanguageSelector'
import { DOCS_RESOURCE_CONTENT } from '../ProjectAPIDocs.constants'
import ResourceContent from '../ResourceContent'
import type { ContentProps } from './Content.types'
import { tempRemovePostgrestText } from './Content.utils'

function getColumnType(type: string, format: string) {
  // json and jsonb both have type=undefined, so check format instead
  if (type === undefined && (format === 'jsonb' || format === 'json')) return 'json'

  switch (type) {
    case 'string':
      return 'string'
    case 'integer':
      return 'number'
    case 'json':
      return 'json'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return type
  }
}

const Entity = ({ language, apikey = '', endpoint = '' }: ContentProps) => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const resource = snap.activeDocsSection[1]

  const { data: jsonSchema, refetch } = useProjectJsonSchemaQuery({ projectRef: ref })

  const definition = jsonSchema?.definitions?.[resource]
  const columns =
    definition !== undefined
      ? Object.entries(definition.properties).map(([id, val]: any) => ({
          ...val,
          id,
          required: (definition?.required ?? []).includes(id),
        }))
      : []

  useEffect(() => {
    if (resource !== undefined) refetch()
  }, [resource])

  if (resource === undefined) return null

  return (
    <div className="divide-y relative">
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-surface-100 z-10 border-b shadow-md">
        <div className="flex flex-col gap-y-1">
          <h2>{resource}</h2>
          <p className="text-sm text-foreground-light">
            {definition?.description ?? 'No description available'}
          </p>
        </div>
        <LanguageSelector />
      </div>
      <div className="space-y-2 px-4 py-4 !border-t-0">
        <p className="text-sm text-foreground-light">Columns</p>
        <Table
          head={[
            <Table.th key="name">Name</Table.th>,
            <Table.th key="format">Format</Table.th>,
            <Table.th key="type">Type</Table.th>,
            <Table.th key="description">Description</Table.th>,
          ]}
          body={columns.map((column) => {
            const formattedColumnType = getColumnType(column.type, column.format)
            return (
              <Table.tr key={column.id}>
                <Table.td title={column.id}>{column.id}</Table.td>
                <Table.td title={column.format}>
                  <p className="truncate">{column.format}</p>
                </Table.td>
                <Table.td title={formattedColumnType}>{formattedColumnType}</Table.td>
                <Table.td title={column.description}>
                  {tempRemovePostgrestText(column.description ?? '').trim()}
                </Table.td>
              </Table.tr>
            )
          })}
        />
      </div>

      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.readRows}
        codeSnippets={DOCS_RESOURCE_CONTENT.readRows.code({
          resourceId: resource,
          endpoint,
          apikey,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.filtering}
        codeSnippets={DOCS_RESOURCE_CONTENT.filtering.code({
          resourceId: resource,
          endpoint,
          apikey,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.insertRows}
        codeSnippets={DOCS_RESOURCE_CONTENT.insertRows.code({
          resourceId: resource,
          endpoint,
          apikey,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.updateRows}
        codeSnippets={DOCS_RESOURCE_CONTENT.updateRows.code({
          resourceId: resource,
          endpoint,
          apikey,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.deleteRows}
        codeSnippets={DOCS_RESOURCE_CONTENT.deleteRows.code({
          resourceId: resource,
          endpoint,
          apikey,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.subscribeChanges}
        codeSnippets={DOCS_RESOURCE_CONTENT.subscribeChanges.code({ resourceId: resource })}
      />
    </div>
  )
}

export default Entity
