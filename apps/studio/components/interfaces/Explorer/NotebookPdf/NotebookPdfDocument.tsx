import { Document, Page, Path, Svg, Text, View } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import type { Snapshot } from 'valtio'

import { type QueryResult } from '../types'
import { NotebookPdfMarkdown } from './NotebookPdfMarkdown'
import { NotebookPdfQueryCell } from './NotebookPdfQueryCell'
import { pdfStyles } from './theme'
import { isQueryCell, type Cell } from '@/data/content/notebooks/notebook-schema'

interface NotebookPdfDocumentProps {
  name: string
  projectName?: string
  cells: readonly Snapshot<Cell>[]
  results: ReadonlyMap<string, QueryResult>
}

function SupabaseLogoMark() {
  return (
    <Svg viewBox="0 0 109 113" style={pdfStyles.headerLogoMark}>
      <Path
        d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0625L99.1935 40.0625C107.384 40.0625 111.952 49.5226 106.859 55.9372L63.7076 110.284Z"
        fill="#3ECF8E"
      />
      <Path
        d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
        fill="#3ECF8E"
      />
    </Svg>
  )
}

export function NotebookPdfDocument({
  name,
  projectName,
  cells,
  results,
}: NotebookPdfDocumentProps) {
  const exportedDate = dayjs().format('MMM D, YYYY')

  return (
    <Document title={name}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerBanner}>
          <View style={pdfStyles.headerLeft}>
            <View style={pdfStyles.headerLogoRow}>
              <SupabaseLogoMark />
              <Text style={pdfStyles.headerLogoText}>supabase</Text>
            </View>
            <Text style={pdfStyles.headerLabel}>EXPLORER NOTEBOOK</Text>
          </View>
          <View style={pdfStyles.headerRight}>
            <Text style={pdfStyles.headerTitle}>{name}</Text>
            <Text style={pdfStyles.headerMeta}>Exported {exportedDate}</Text>
            {projectName !== undefined && (
              <Text style={pdfStyles.headerMeta}>Project: {projectName}</Text>
            )}
          </View>
        </View>
        <View style={pdfStyles.headerRule} />

        {cells.map((cell) =>
          isQueryCell(cell) ? (
            <NotebookPdfQueryCell key={cell._id} cell={cell} result={results.get(cell._id)} />
          ) : (
            <NotebookPdfMarkdown key={cell._id} markdown={cell.text} />
          )
        )}
      </Page>
    </Document>
  )
}
