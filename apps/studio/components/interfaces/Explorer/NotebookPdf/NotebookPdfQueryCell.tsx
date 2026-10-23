import { Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { Snapshot } from 'valtio'

import { type QueryResult } from '../types'
import { NotebookPdfChart } from './NotebookPdfChart'
import { NotebookPdfTable } from './NotebookPdfTable'
import { pdfStyles } from './theme'
import { anchorLogTimeRange } from '@/components/interfaces/QuerySources/LogTimeRange.utils'
import { formatTimeRange } from '@/components/ui/AIAssistantPanel/AssistantNotebookPreview.utils'
import { type QueryCell } from '@/data/content/notebooks/notebook-schema'
import { pluralize } from '@/lib/helpers'

function SqlBlock({ sql }: { sql: string }) {
  return (
    <View style={pdfStyles.sqlBox}>
      <Text style={pdfStyles.sqlText}>{sql}</Text>
    </View>
  )
}

function ResultsTable({ rows }: { rows: readonly Record<string, unknown>[] }) {
  return (
    <View>
      <NotebookPdfTable rows={rows} />
    </View>
  )
}

function QueryResultsSection({
  result,
  view,
  chart,
}: {
  result: QueryResult | undefined
  view: 'table' | 'chart'
  chart: Snapshot<QueryCell>['chart']
}): ReactElement {
  if (!result) {
    return (
      <View style={pdfStyles.resultsBox}>
        <Text style={pdfStyles.resultsPlaceholder}>Query has not been run.</Text>
      </View>
    )
  }

  if (result.error) {
    return (
      <View style={pdfStyles.resultsBox}>
        <Text style={pdfStyles.resultsError}>Error: {result.error.message}</Text>
      </View>
    )
  }

  const rows = result.rows ?? []
  if (rows.length === 0) {
    return (
      <View style={pdfStyles.resultsBox}>
        <Text style={pdfStyles.resultsPlaceholder}>Success. No rows returned</Text>
      </View>
    )
  }

  if (view === 'chart') {
    return (
      <View style={pdfStyles.resultsBox}>
        <NotebookPdfChart chart={chart} rows={rows} />
      </View>
    )
  }

  return <ResultsTable rows={rows} />
}

interface NotebookPdfQueryCellProps {
  cell: Snapshot<QueryCell>
  // The notebook's `as_of`, which relative log ranges count back from
  asOf?: string | null
  result: QueryResult | undefined
}

export function NotebookPdfQueryCell({ cell, asOf, result }: NotebookPdfQueryCellProps) {
  const view = cell.view ?? 'table'
  const rowCount = result?.rows?.length ?? 0
  const rowLimit = cell._tag === 'database_cell' ? cell.row_limit : undefined

  return (
    <View style={pdfStyles.queryCard} wrap>
      <View style={pdfStyles.queryHeaderRow}>
        <Text style={pdfStyles.queryTitle}>{cell.title ?? 'Untitled query'}</Text>
        {cell._tag === 'log_cell' && (
          // react-pdf's default font (Helvetica) can't render the '→' from formatTimeRange
          <Text style={pdfStyles.footerText}>
            {formatTimeRange(anchorLogTimeRange(cell.time_range, asOf)).replace('→', '-')}
          </Text>
        )}
      </View>

      <SqlBlock sql={result?.sql ?? cell.unchecked_sql} />

      <QueryResultsSection result={result} view={view} chart={cell.chart} />

      <View style={pdfStyles.footerRow}>
        <Text style={pdfStyles.footerText}>
          {rowCount.toLocaleString()} {pluralize(rowCount, 'row')}
        </Text>
        {rowLimit !== undefined && (
          <>
            <Text style={pdfStyles.footerText}>·</Text>
            <Text style={pdfStyles.footerText}>
              {rowLimit < 0 ? 'No row limit' : `Limit ${rowLimit} rows`}
            </Text>
          </>
        )}
      </View>
    </View>
  )
}
