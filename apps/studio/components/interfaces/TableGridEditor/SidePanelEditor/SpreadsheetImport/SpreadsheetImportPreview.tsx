import { AlertCircle, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Badge,
  Button,
  cn,
  Collapsible,
  SidePanel,
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
  WarningIcon,
} from 'ui'
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

export const SpreadsheetImportPreview = ({
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

  /**
   * Remove items with duplicate row and code values because of the papaparse issue
   * @link https://github.com/supabase/supabase/pull/38422#issue-3381886843
   **/
  const dedupedErrors = errors.filter(
    (error, index, self) =>
      index === self.findIndex((t) => t.row === error.row && t.code === error.code)
  )

  return (
    <Collapsible open={expandPreview} onOpenChange={setExpandPreview} className={''}>
      <Collapsible.Trigger asChild>
        <SidePanel.Content>
          <div className="py-1 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm">Preview data to be imported</p>
              {!isCompatible && <Badge variant="destructive">Data incompatible</Badge>}
              {dedupedErrors.length > 0 && (
                <Badge variant="warning">
                  {dedupedErrors.length} {dedupedErrors.length === 1 ? 'issue' : 'issues'} found
                </Badge>
              )}
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
          {(!isCompatible || dedupedErrors.length > 0) && (
            <Alert_Shadcn_ variant="warning" className="my-4">
              <WarningIcon />
              <AlertTitle_Shadcn_>Issues found in spreadsheet</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                <div className="space-y-2">
                  {isCompatible ? (
                    <p className="text-sm">
                      {selectedTable !== undefined
                        ? `This CSV can still be imported, but we found ${dedupedErrors.length === 1 ? 'an issue' : 'issues'}:`
                        : `You can still create the table, but we found ${dedupedErrors.length === 1 ? 'an issue' : 'issues'}:`}
                    </p>
                  ) : (
                    <p className="text-sm">
                      This CSV <span className="text-red-900">cannot</span> be imported into your
                      table due to incompatible headers.
                    </p>
                  )}
                  {!isCompatible && (
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="size-[14px] flex items-center justify-center translate-y-[3px]">
                          <div className="size-[6px] rounded-full bg-foreground-lighter" />
                        </div>
                        <p className="text-sm">
                          The column{incompatibleHeaders.length > 1 ? 's' : ''}{' '}
                          {incompatibleHeaders.map((x) => `"${x}"`).join(', ')}{' '}
                          {incompatibleHeaders.length > 1 ? 'are' : 'is'} not present in your table
                        </p>
                      </div>
                    </div>
                  )}
                  <ul className="space-y-2 list-none">
                    {dedupedErrors.map((error: any, idx: number) => {
                      const key = `import-error-${idx}`
                      const isExpanded = expandedErrors.includes(key)
                      const errorData = error.data

                      return (
                        <li key={key} className="space-y-2">
                          {errorData !== undefined ? (
                            <button
                              type="button"
                              className="flex items-center space-x-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              onClick={() => onSelectExpandError(key)}
                              aria-expanded={isExpanded}
                              aria-controls={`${key}-panel`}
                              aria-labelledby={`${key}-summary`}
                            >
                              <ChevronRight
                                size={14}
                                className={cn('transform transition-transform', {
                                  'rotate-90': isExpanded,
                                })}
                                aria-hidden="true"
                              />
                              <span
                                id={`${key}-summary`}
                                className="sr-only"
                              >{`Toggle details for row ${error.row}`}</span>
                              <p className="text-sm">Row {error.row}:</p>
                              <p className="text-sm">{error.message}</p>
                              {errorData?.__parsed_extra && (
                                <>
                                  <ArrowRight size={14} aria-hidden="true" />
                                  <p className="text-sm">Extra field(s):</p>
                                  <ul className="ml-2 list-disc">
                                    {errorData.__parsed_extra.map((value: string, i: number) => (
                                      <li key={i}>
                                        <code className="text-xs">{value}</code>
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div
                                className="size-[14px] flex items-center justify-center"
                                aria-hidden="true"
                              >
                                <div className="size-[6px] rounded-full bg-foreground-lighter" />
                              </div>
                              <p className="text-sm">Row {error.row}:</p>
                              <p className="text-sm">{error.message}</p>
                            </div>
                          )}
                          {errorData !== undefined && isExpanded && (
                            <SpreadsheetPreviewGrid
                              headers={spreadsheetData.headers}
                              rows={[errorData]}
                            />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
        </SidePanel.Content>
      </Collapsible.Content>
    </Collapsible>
  )
}
