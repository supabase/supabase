'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CodeMirrorSqlEditor } from 'surfaces/codemirror'
import { Explorer, type ExplorerHandle } from 'surfaces/explorer'
import type { RunQuery } from 'surfaces/query'

import {
  companies,
  companiesByIndustry,
  companiesTable,
  roundTrip,
  sampleCapabilities,
} from './surfaces-sample-data'

// The host runs queries. Here a table read returns the sample table and any other SQL returns
// a sample aggregate.
const runQuery: RunQuery = async (request) =>
  roundTrip({
    rows: request.entity ? companies : companiesByIndustry,
    sql: request.sql,
    hasMore: false,
    offset: 0,
    limit: request.limit ?? 100,
    ...(request.entity ? { table: companiesTable } : {}),
  })

export default function SurfacesExplorer() {
  const explorer = useRef<ExplorerHandle>(null)
  const [schema, setSchema] = useState('public')
  const hasOpened = useRef(false)

  // Start on a table, like a host opening the Explorer at a deep link.
  useEffect(() => {
    if (hasOpened.current) return
    hasOpened.current = true
    explorer.current?.openTable({ schema: 'public', name: 'companies' })
  }, [])

  return (
    <div className="flex h-[560px] w-full min-h-0 flex-col overflow-hidden rounded-md border">
      <Explorer
        ref={explorer}
        capabilities={sampleCapabilities}
        schema={schema}
        onSchemaChange={setSchema}
        schemas={{ status: 'success', data: ['public', 'auth', 'storage'] }}
        tables={{
          status: 'success',
          data:
            schema === 'public'
              ? [
                  { name: 'companies', rows: companies.length, rls_enabled: true },
                  { name: 'contacts', rows: 1, rls_enabled: true },
                  { name: 'deals', rows: 1, rls_enabled: false },
                ]
              : [],
        }}
        onRetryNavigation={() => {}}
        onRunQuery={runQuery}
        onSaveRow={async (change) => {
          toast(`Saved a row in ${change.table}`)
          return roundTrip({ ...(change.kind === 'update' ? change.key : {}), ...change.values })
        }}
        SqlEditor={CodeMirrorSqlEditor}
      />
    </div>
  )
}
