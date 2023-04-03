import clsx from 'clsx'
import { useEffect, useState } from 'react'
import {
  SidePanel,
  Badge,
  Button,
  IconChevronDown,
  IconChevronRight,
  IconArrowRight,
  IconAlertCircle,
} from 'ui'

import { SpreadsheetData } from './SpreadsheetImport.types'
import SpreadsheetPreviewGrid from './SpreadsheetPreviewGrid'
import { PostgresTable } from '@supabase/postgres-meta'

const MAX_ROWS = 20
const MAX_HEADERS = 20

interface SpreadsheetImportPreviewProps {
  selectedTable: PostgresTable
  selectedHeaders: string[]
  spreadsheetData: SpreadsheetData
  errors?: any[]
}

const SpreadsheetImportPreview = ({
  selectedTable,
  selectedHeaders,
  spreadsheetData,
  errors = [],
}: SpreadsheetImportPreviewProps) => {
  const [expandPreview, setExpandPreview] = useState(false)
  const [expandedErrors, setExpandedErrors] = useState<string[]>([])

  const { headers, rows } = spreadsheetData
  const previewHeaders = headers
    .filter((header) => selectedHeaders.includes(header))
    .slice(0, MAX_HEADERS)
  const previewRows = rows.slice(0, MAX_ROWS)

  useEffect(() => {
    setExpandPreview(true)
  }, [spreadsheetData])

  const onSelectExpandError = (key: string) => {
    if (expandedErrors.includes(key)) {
      setExpandedErrors(expandedErrors.filter((error) => error !== key))
    } else {
      setExpandedErrors(expandedErrors.concat([key]))
    }
  }

  return (
    <SidePanel.Content>
      <div className="py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm">Preview data to be imported</p>
            {errors.length > 0 && <Badge color="red">{errors.length} errors present</Badge>}
          </div>
          <Button
            type="text"
            icon={
              <IconChevronDown
                size={18}
                strokeWidth={2}
                className={clsx('text-scale-1100', expandPreview && 'rotate-180')}
              />
            }
            className="px-1"
            onClick={() => setExpandPreview(!expandPreview)}
          />
        </div>
      </div>
      <div
        style={{ maxHeight: expandPreview ? '1000px' : '0px' }}
        className="transition-all overflow-y-hidden"
      >
        <div className="mb-4">
          <p className="text-sm text-scale-1000">
            {selectedTable === undefined
              ? `Your table will have ${spreadsheetData.rowCount.toLocaleString()} rows and the
                        following ${spreadsheetData.headers.length} columns.`
              : `A total of ${spreadsheetData.rowCount.toLocaleString()} rows will be added to the table "${
                  selectedTable.name
                }"`}
          </p>
          <p className="text-sm text-scale-1000">
            Here is a preview of the data that will be added (up to the first 20 columns and first
            20 rows).
          </p>
        </div>
        <div className="mb-4">
          {previewHeaders.length > 0 && previewRows.length > 0 ? (
            <SpreadsheetPreviewGrid height={350} headers={previewHeaders} rows={previewRows} />
          ) : (
            <div className="flex items-center justify-center py-4 border border-scale-600 rounded-md space-x-2">
              <IconAlertCircle size={16} strokeWidth={1.5} className="text-scale-1000" />
              <p className="text-sm text-scale-1000">
                {previewHeaders.length === 0
                  ? 'No headers have been selected'
                  : previewRows.length === 0
                  ? 'Your CSV contains no data'
                  : ''}
              </p>
            </div>
          )}
        </div>
        {errors.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex flex-col space-y-1">
              <p>Issues found in spreadsheet</p>
              <p className="text-scale-1000">
                Your table can still be created nonetheless despite issues in the following rows.
              </p>
            </div>
            <div className="space-y-2">
              {errors.map((error: any, idx: number) => {
                const key = `import-error-${idx}`
                const isExpanded = expandedErrors.includes(key)
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <IconChevronRight
                        className={`transform cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
                        size={14}
                        onClick={() => onSelectExpandError(key)}
                      />
                      <p className="w-14">Row: {error.row}</p>
                      <p>{error.message}</p>
                      {error.data?.__parsed_extra && (
                        <>
                          <IconArrowRight size={14} />
                          <p>Extra field(s):</p>
                          {error.data?.__parsed_extra.map((value: any, i: number) => (
                            <code key={i} className="text-sm">
                              {value}
                            </code>
                          ))}
                        </>
                      )}
                    </div>
                    {isExpanded && (
                      <SpreadsheetPreviewGrid
                        headers={spreadsheetData.headers}
                        rows={[error.data]}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </SidePanel.Content>
  )
}

export default SpreadsheetImportPreview
