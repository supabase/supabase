'use client'

import { useState } from 'react'
import { CodeMirrorSqlEditor } from 'surfaces/codemirror'
import { QueryEditorFrame, QueryResultFooter } from 'surfaces/explorer'
import { QueryResultChart, QueryResultsGrid } from 'surfaces/query'

import { companiesByIndustry, companiesByIndustrySql } from './surfaces-sample-data'

type Display = NonNullable<React.ComponentProps<typeof QueryEditorFrame>['display']>

export default function SurfacesQueryEditor() {
  const [title, setTitle] = useState('Companies by industry')
  const [sql, setSql] = useState(companiesByIndustrySql)
  const [showQuery, setShowQuery] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [rows, setRows] = useState(companiesByIndustry)
  const [display, setDisplay] = useState<Display>({
    view: 'table',
    chart: {
      type: 'bar',
      x_column: 'industry',
      y_series: ['companies'],
      cumulative: false,
      scale: 'linear',
      show_labels: true,
    },
  })

  // The consumer owns execution. Here a run just reloads the sample rows.
  function handleRun() {
    setIsExecuting(true)
    setRows([])
    setTimeout(() => {
      setRows(companiesByIndustry)
      setIsExecuting(false)
    }, 600)
  }

  const columns = Object.keys(rows[0] ?? {})

  return (
    <div className="w-full">
      <QueryEditorFrame
        variant="embedded"
        title={title}
        onTitleChange={setTitle}
        showQuery={showQuery}
        onShowQueryChange={setShowQuery}
        editor={() => (
          <CodeMirrorSqlEditor
            value={sql}
            source="database"
            onChange={setSql}
            onRun={handleRun}
            className="h-36"
          />
        )}
        results={
          display.view === 'chart' ? (
            <div className="flex h-64">
              <QueryResultChart title={title} chart={display.chart} result={{ rows }} />
            </div>
          ) : (
            <QueryResultsGrid rows={rows} columns={columns} isBusy={isExecuting} />
          )
        }
        footer={<QueryResultFooter count={rows.length} rowLimit={1000} />}
        display={display}
        displayResult={{ rows }}
        onDisplayChange={setDisplay}
        run={{
          isExecuting,
          isDisabled: sql.trim().length === 0,
          hasSelection: false,
          onRun: handleRun,
          onRunSelected: handleRun,
        }}
      />
    </div>
  )
}
