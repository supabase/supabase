'use client'

import { useState } from 'react'
import { CodeMirrorSqlEditor } from 'surfaces/codemirror'
import { QueryEditorFrame, QueryResultFooter } from 'surfaces/explorer'
import { QueryResultsGrid } from 'surfaces/query'

import { companies } from './surfaces-sample-data'

export default function SurfacesQueryEditorViewport() {
  const [sql, setSql] = useState('select * from companies order by id;')
  const [showQuery, setShowQuery] = useState(true)
  const columns = Object.keys(companies[0])

  return (
    // A viewport fills a bounded parent, like an Explorer tab's content area.
    <div className="flex h-[480px] w-full min-h-0 flex-col overflow-hidden rounded-md border">
      <QueryEditorFrame
        variant="viewport"
        title="companies"
        showQuery={showQuery}
        onShowQueryChange={setShowQuery}
        editor={() => (
          <CodeMirrorSqlEditor
            value={sql}
            source="database"
            onChange={setSql}
            onRun={() => {}}
            className="h-full"
          />
        )}
        results={<QueryResultsGrid rows={companies} columns={columns} />}
        footer={<QueryResultFooter count={companies.length} />}
      />
    </div>
  )
}
