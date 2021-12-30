import { useCallback, useState, FC, useEffect } from 'react'
import { debounce, includes } from 'lodash'
import { SidePanel, Typography, Tabs, IconArrowRight, IconChevronRight } from '@supabase/ui'

import { useStore } from 'hooks'
import ActionBar from '../../ActionBar'
import SpreadSheetTextInput from './SpreadSheetTextInput'
import SpreadSheetFileUpload from './SpreadSheetFileUpload'
import SpreadsheetPreview from './SpreadsheetPreview'
import { SpreadsheetData } from './SpreadsheetImport.types'
import { parseSpreadsheet, parseSpreadsheetText } from './SpreadsheetImport.utils'
import { UPLOAD_FILE_TYPES, EMPTY_SPREADSHEET_DATA } from './SpreadsheetImport.constants'

interface Props {
  debounceDuration?: number
  headers?: string[]
  rows?: any[]
  visible: boolean
  saveContent: (prefillData: any) => void
  closePanel: () => void
}

const SpreadsheetImport: FC<Props> = ({
  debounceDuration = 250,
  headers = [],
  rows = [],
  saveContent,
  closePanel,
  visible = false,
}) => {
  const { ui } = useStore()

  useEffect(() => {
    if (visible) {
      if (headers.length === 0) {
        resetSpreadsheetImport()
      }
    }
  }, [visible])

  const [input, setInput] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [parseProgress, setParseProgress] = useState<number>(0)
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData>({
    headers: headers,
    rows: rows,
    rowCount: 0,
    columnTypeMap: {},
  })
  const [errors, setErrors] = useState<any>([])
  const [expandedErrors, setExpandedErrors] = useState<string[]>([])

  const onProgressUpdate = (progress: number) => {
    setParseProgress(progress)
  }

  const onFileUpload = async (event: any) => {
    setParseProgress(0)
    event.persist()
    const [file] = event.target.files || event.dataTransfer.files
    if (!file || !includes(UPLOAD_FILE_TYPES, file?.type)) {
      ui.setNotification({
        category: 'info',
        message: 'Sorry! We only accept CSV or TSV file types, please upload another file.',
      })
    } else {
      setUploadedFile(file)
      const { headers, rowCount, columnTypeMap, errors } = await parseSpreadsheet(
        file,
        onProgressUpdate
      )
      if (errors.length > 0) {
        ui.setNotification({
          error: errors,
          category: 'error',
          message: `Some issues have been detected on ${errors.length} rows. More details below the content preview.`,
        })
      }
      setErrors(errors)
      setSpreadsheetData({ headers, rows: [], rowCount, columnTypeMap })
    }
    event.target.value = ''
  }

  const resetSpreadsheetImport = () => {
    setInput('')
    setSpreadsheetData(EMPTY_SPREADSHEET_DATA)
    setUploadedFile(null)
    setErrors([])
    setExpandedErrors([])
  }

  const readSpreadsheetText = async (text: string) => {
    if (text.length > 0) {
      const { headers, rows, columnTypeMap, errors } = await parseSpreadsheetText(text)
      if (errors.length > 0) {
        ui.setNotification({
          error: errors,
          category: 'error',
          message: `Some issues have been detected on ${errors.length} rows. More details below the content preview.`,
        })
      }
      setErrors(errors)
      setSpreadsheetData({ headers, rows, rowCount: rows.length, columnTypeMap })
    } else {
      setSpreadsheetData(EMPTY_SPREADSHEET_DATA)
    }
  }

  const handler = useCallback(debounce(readSpreadsheetText, debounceDuration), [])
  const onInputChange = (event: any) => {
    setInput(event.target.value)
    handler(event.target.value)
  }

  const onSelectExpandError = (key: string) => {
    if (expandedErrors.includes(key)) {
      setExpandedErrors(expandedErrors.filter((error) => error !== key))
    } else {
      setExpandedErrors(expandedErrors.concat([key]))
    }
  }

  return (
    <SidePanel
      wide
      visible={visible}
      align="right"
      title="Add content to new table"
      onCancel={(event: any) => {
        // Only close if specifically hit the X button, this is to have the
        // side panel work with toast messages (clicking on toast will close the panel)
        if (event?.target) closePanel()
      }}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          applyFunction={() => {
            saveContent({
              file: uploadedFile,
              ...spreadsheetData,
            })
          }}
        />
      }
    >
      <div className="flex flex-col">
        <Tabs block>
          {/* @ts-ignore */}
          <Tabs.Panel id="fileUpload" label="Upload CSV">
            <SpreadSheetFileUpload
              parseProgress={parseProgress}
              uploadedFile={uploadedFile}
              onFileUpload={onFileUpload}
              removeUploadedFile={resetSpreadsheetImport}
            />
          </Tabs.Panel>
          {/* @ts-ignore */}
          <Tabs.Panel id="pasteText" label="Paste text">
            <SpreadSheetTextInput input={input} onInputChange={onInputChange} />
          </Tabs.Panel>
        </Tabs>
      </div>

      {spreadsheetData.headers.length > 0 && (
        <div className="py-5 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-col space-y-1">
              <Typography.Text>Content Preview</Typography.Text>
              <Typography.Text type="secondary">
                Your table will have {spreadsheetData.rowCount.toLocaleString()} rows and the
                following {spreadsheetData.headers.length} columns.
              </Typography.Text>
            </div>
            <SpreadsheetPreview headers={spreadsheetData.headers} />
          </div>
          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-col space-y-1">
                <Typography.Text>Issues found in spreadsheet</Typography.Text>
                <Typography.Text type="secondary">
                  Your table can still be created nonetheless despite issues in the following rows.
                </Typography.Text>
              </div>
              <div className="space-y-2">
                {errors.map((error: any, idx: number) => {
                  const key = `import-error-${idx}`
                  const isExpanded = expandedErrors.includes(key)
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <IconChevronRight
                          className={`cursor-pointer transform ${isExpanded ? 'rotate-90' : ''}`}
                          size={14}
                          onClick={() => onSelectExpandError(key)}
                        />
                        <Typography.Text className="w-14">Row: {error.row}</Typography.Text>
                        <Typography.Text>{error.message}</Typography.Text>
                        {error.data?.__parsed_extra && (
                          <>
                            <IconArrowRight size={14} />
                            <Typography.Text>Extra field(s):</Typography.Text>
                            {error.data?.__parsed_extra.map((value: any) => (
                              <Typography.Text code small>
                                {value}
                              </Typography.Text>
                            ))}
                          </>
                        )}
                      </div>
                      {isExpanded && (
                        <SpreadsheetPreview headers={spreadsheetData.headers} rows={[error.data]} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </SidePanel>
  )
}

export default SpreadsheetImport
