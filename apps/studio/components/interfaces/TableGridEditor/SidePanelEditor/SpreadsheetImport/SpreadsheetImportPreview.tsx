import { AlertCircle, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge, Button, cn, Collapsible, SidePanel } from 'ui'
import type { SpreadsheetData } from './SpreadsheetImport.types'
import SpreadsheetPreviewGrid from './SpreadsheetPreviewGrid'

const MAX_ROWS = 20
const MAX_HEADERS = 20

interface SpreadsheetImportPreviewProps {
  selectedTable?: { name: string }
  spreadsheetData: SpreadsheetData
  errors?: any[]
  selectedHeaders: string[]
  incompatibleHeaders: string[]
}

const SpreadsheetImportPreview = ({
  selectedTable,
  spreadsheetData,
  errors = [],
  selectedHeaders,
  incompatibleHeaders,
}: SpreadsheetImportPreviewProps) => {
  const [expandPreview, setExpandPreview] = useState(false)
  const [expandedErrors, setExpandedErrors] = useState<string[]>([])

  const { headers, rows } = spreadsheetData
  const previewHeaders = headers
    .filter((header) => selectedHeaders.includes(header))
    .slice(0, MAX_HEADERS)
  const previewRows = rows.slice(0, MAX_ROWS)

  const isCompatible = selectedTable !== undefined ? incompatibleHeaders.length === 0 : true

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
    <Collapsible open={expandPreview} onOpenChange={setExpandPreview} className={''}>
      <Collapsible.Trigger asChild>
        <SidePanel.Content>
          <div className="py-1 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm">Preview data to be imported</p>
              {!isCompatible && <Badge variant="destructive">Data incompatible</Badge>}
              {errors.length > 0 && <Badge variant="warning">{errors.length} issues found</Badge>}
            </div>
            <Button
              type="text"
              icon={
                <ChevronDown
                  size={18}
                  strokeWidth={2}
                  className={cn('text-foreground-light', expandPreview && 'rotate-180')}
                />
              }
              className="px-1"
              onClick={() => setExpandPreview(!expandPreview)}
            />
          </div>
        </SidePanel.Content>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <SidePanel.Content>
          <div className="mb-4">
            <p className="text-sm text-foreground-light">
              {selectedTable === undefined
                ? `Your table will have ${spreadsheetData.rowCount.toLocaleString()} rows and the
                        following ${spreadsheetData.headers.length} columns.`
                : `A total of ${spreadsheetData.rowCount.toLocaleString()} rows will be added to the table "${
                    selectedTable.name
                  }"`}
            </p>
            <p className="text-sm text-foreground-light">
              Here is a preview of the data that will be added (up to the first 20 columns and first
              20 rows).
            </p>
          </div>
          <div className="mb-4">
            {previewHeaders.length > 0 && previewRows.length > 0 ? (
              <SpreadsheetPreviewGrid height={350} headers={previewHeaders} rows={previewRows} />
            ) : (
              <div className="flex items-center justify-center py-4 border border-control rounded-md space-x-2">
                <AlertCircle size={16} strokeWidth={1.5} className="text-foreground-light" />
                <p className="text-sm text-foreground-light">
                  {previewHeaders.length === 0
                    ? 'No headers have been selected'
                    : previewRows.length === 0
                      ? 'Your CSV contains no data'
                      : ''}
                </p>
              </div>
            )}
          </div>
          {(!isCompatible || errors.length > 0) && (
            <div className="space-y-2 my-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm">Issues found in spreadsheet</p>
                {isCompatible && (
                  <p className="text-sm text-foreground-light">
                    {selectedTable !== undefined
                      ? 'This CSV can still be imported into your table despite issues in the following rows.'
                      : 'Your table can still be created nonetheless despite issues in the following rows.'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {!isCompatible && (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-[14px] h-[14px] flex items-center justify-center translate-y-[3px]">
                        <div className="w-[6px] h-[6px] rounded-full bg-foreground-lighter" />
                      </div>
                      <p className="text-sm">
                        This CSV <span className="text-red-900">cannot</span> be imported into your
                        table due to incompatible headers:
                        <br />
                        The column{incompatibleHeaders.length > 1 ? 's' : ''}{' '}
                        {incompatibleHeaders.map((x) => `"${x}"`).join(', ')}{' '}
                        {incompatibleHeaders.length > 1 ? 'are' : 'is'} not present in your table
                      </p>
                    </div>
                  </div>
                )}
                {errors.map((error: any, idx: number) => {
                  const key = `import-error-${idx}`
                  const isExpanded = expandedErrors.includes(key)

                  return (
                    <div key={key} className="space-y-2">
                      <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => onSelectExpandError(key)}
                      >
                        {error.data !== undefined ? (
                          <ChevronRight
                            size={14}
                            className={`transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        ) : (
                          <div className="w-[14px] h-[14px] flex items-center justify-center">
                            <div className="w-[6px] h-[6px] rounded-full bg-foreground-lighter" />
                          </div>
                        )}
                        {error.data !== undefined && (
                          <p className="text-sm w-14">Row: {error.row}</p>
                        )}
                        <p className="text-sm">{error.message}</p>
                        {error.data?.__parsed_extra && (
                          <>
                            <ArrowRight size={14} />
                            <p className="text-sm">Extra field(s):</p>
                            {error.data?.__parsed_extra.map((value: any, i: number) => (
                              <code key={i} className="text-xs">
                                {value}
                              </code>
                            ))}
                          </>
                        )}
                      </div>
                      {error.data !== undefined && isExpanded && (
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
        </SidePanel.Content>
      </Collapsible.Content>
    </Collapsible>
  )
}

export default SpreadsheetImportPreview
