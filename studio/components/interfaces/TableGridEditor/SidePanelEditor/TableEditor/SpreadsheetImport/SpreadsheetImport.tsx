import { useCallback, useState, FC } from 'react'
import { debounce, includes } from 'lodash'
import { SidePanel, Typography } from '@supabase/ui'

import { useStore } from 'hooks'
import Telemetry from 'lib/telemetry'
import ActionBar from '../../ActionBar'
import { parseSpreadsheet, parseSpreadsheetText } from './SpreadsheetImport.utils'
import { UPLOAD_FILE_TYPES } from './SpreadsheetImport.constants'
import SpreadSheetTextInput from './SpreadSheetTextInput'
import SpreadSheetFileUpload from './SpreadSheetFileUpload'

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

  const [spreadsheetData, setSpreadsheetData] = useState<any>({
    headers: headers,
    rows: rows,
    rowCount: 0,
  })

  const [input, setInput] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<any>(null)

  const [view, setView] = useState<string>('fileUpload')
  const [parseProgress, setParseProgress] = useState<number>(0)

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
      const { headers, rowCount, rowPreview, errors } = await parseSpreadsheet(
        file,
        onProgressUpdate
      )
      if (errors.length <= 5) {
        errors.map((error: any) => {
          ui.setNotification({
            category: 'error',
            message: `Error found at row ${error.row} - ${error.type}: ${error.code}`,
          })
        })
      } else if (errors.length > 5) {
        ui.setNotification({
          error: errors,
          category: 'error',
          message: `Multiple errors have been detected on ${errors.length} rows. Do check the file you have uploaded for any discrepancies.`,
        })
      }
      setSpreadsheetData({ headers, rowCount, rows: rowPreview })
    }
    event.target.value = ''
  }

  const removeUploadedFile = () => {
    setSpreadsheetData({ headers: [], rows: [], rowCount: 0 })
    setUploadedFile(null)
  }

  const readInputSpreadsheet = async (text: string) => {
    if (text.length > 0) {
      const { headers, rows, errors } = await parseSpreadsheetText(text)
      if (errors.length <= 5) {
        errors.map((error: any) => {
          ui.setNotification({
            error,
            category: 'error',
            message: `Error found at row ${error.row || 0} - ${error.type}: ${error.code}`,
          })
        })
      } else if (errors.length > 5) {
        ui.setNotification({
          error: errors,
          category: 'error',
          message: `Multiple errors have been detected on ${errors.length} rows. Do check your input for any discrepancies.`,
        })
      }
      setSpreadsheetData({ headers, rows, rowCount: rows.length })
    } else {
      setSpreadsheetData({ headers: [], rows: [], rowCount: 0 })
    }
  }

  const handler = useCallback(debounce(readInputSpreadsheet, debounceDuration), [])
  const onInputChange = (event: any) => {
    setInput(event.target.value)
    handler(event.target.value)
  }

  return (
    <SidePanel
      wide
      visible={visible}
      align="right"
      title="Add content to new table"
      onCancel={closePanel}
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
            Telemetry.sendEvent('table_editor', 'spreadsheet_import_method', view)
          }}
        />
      }
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-center border dark:border-dark rounded-md w-full mb-4">
          <div
            className={`
              flex items-center justify-center w-1/2 p-2 cursor-pointer hover:bg-bg-secondary-light dark:hover:bg-bg-alt-dark
              transition ease-in-out duration-150 border-r dark:border-dark
              ${
                view === 'fileUpload'
                  ? ' text-typography-body-light dark:text-typography-body-dark bg-bg-alt-light dark:bg-bg-alt-dark'
                  : ' text-typography-body-secondary-light dark:text-typography-body-secondary-dark'
              }
            `}
            onClick={() => setView('fileUpload')}
          >
            <p className="text-sm">Upload CSV</p>
          </div>
          <div
            className={`
              flex items-center justify-center w-1/2 p-2 cursor-pointer hover:bg-bg-secondary-light dark:hover:bg-bg-alt-dark
              transition ease-in-out duration-150
              ${
                view === 'pasteText'
                  ? ' text-typography-body-light dark:text-typography-body-dark bg-bg-alt-light dark:bg-bg-alt-dark'
                  : ' text-typography-body-secondary-light dark:text-typography-body-secondary-dark'
              }
            `}
            onClick={() => setView('pasteText')}
          >
            <p className="text-sm">Paste Text</p>
          </div>
        </div>

        {view === 'pasteText' ? (
          <SpreadSheetTextInput input={input} onInputChange={onInputChange} />
        ) : (
          <SpreadSheetFileUpload
            parseProgress={parseProgress}
            uploadedFile={uploadedFile}
            onFileUpload={onFileUpload}
            removeUploadedFile={removeUploadedFile}
          />
        )}
      </div>
      {spreadsheetData.headers.length > 0 && (
        <div className="py-5">
          <Typography.Text>
            <p>Content Preview</p>
            <p className="mt-2 text-sm">
              Your table will have {spreadsheetData.rowCount.toLocaleString()} rows and the
              following {spreadsheetData.headers.length} columns.
            </p>
          </Typography.Text>
          <div className="flex flex-wrap items-center mt-3">
            {spreadsheetData.headers.map((header: string) => (
              <Typography.Text key={`preview_${header}`}>
                <div className="rounded-md border dark:border-gray-500 border-dashed py-1 px-3 mr-2 mb-2 text-sm">
                  {header}
                </div>
              </Typography.Text>
            ))}
          </div>
        </div>
      )}
    </SidePanel>
  )
}

export default SpreadsheetImport
