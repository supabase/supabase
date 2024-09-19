import type { PostgresTable } from '@supabase/postgres-meta'
import { debounce, includes, noop } from 'lodash'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button, SidePanel, Tabs } from 'ui'
import ActionBar from '../ActionBar'
import type { ImportContent } from '../TableEditor/TableEditor.types'
import SpreadSheetFileUpload from './SpreadSheetFileUpload'
import SpreadsheetImportConfiguration from './SpreadSheetImportConfiguration'
import SpreadSheetTextInput from './SpreadSheetTextInput'
import { EMPTY_SPREADSHEET_DATA, UPLOAD_FILE_TYPES } from './SpreadsheetImport.constants'
import type { SpreadsheetData } from './SpreadsheetImport.types'
import {
  acceptedFileExtension,
  parseSpreadsheet,
  parseSpreadsheetText,
} from './SpreadsheetImport.utils'
import SpreadsheetImportPreview from './SpreadsheetImportPreview'
import { ExternalLink } from 'lucide-react'

const MAX_CSV_SIZE = 1024 * 1024 * 100 // 100 MB

interface SpreadsheetImportProps {
  debounceDuration?: number
  headers?: string[]
  rows?: any[]
  visible: boolean
  selectedTable?: PostgresTable
  saveContent: (prefillData: ImportContent) => void
  closePanel: () => void
  updateEditorDirty?: (value: boolean) => void
}

const SpreadsheetImport = ({
  visible = false,
  debounceDuration = 250,
  headers = [],
  rows = [],
  selectedTable,
  saveContent,
  closePanel,
  updateEditorDirty = noop,
}: SpreadsheetImportProps) => {
  useEffect(() => {
    if (visible && headers.length === 0) {
      resetSpreadsheetImport()
    }
  }, [visible])

  const [tab, setTab] = useState<'fileUpload' | 'pasteText'>('fileUpload')
  const [input, setInput] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File>()
  const [parseProgress, setParseProgress] = useState<number>(0)
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData>({
    headers: headers,
    rows: rows,
    rowCount: 0,
    columnTypeMap: {},
  })
  const [errors, setErrors] = useState<any>([])
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>([])

  const selectedTableColumns = (selectedTable?.columns ?? []).map((column) => column.name)
  const incompatibleHeaders = selectedHeaders.filter(
    (header) => !selectedTableColumns.includes(header)
  )
  const isCompatible = selectedTable !== undefined ? incompatibleHeaders.length === 0 : true

  const onProgressUpdate = (progress: number) => {
    setParseProgress(progress)
  }

  const onFileUpload = async (event: any) => {
    setParseProgress(0)
    event.persist()
    const [file] = event.target.files || event.dataTransfer.files

    if (!file || !includes(UPLOAD_FILE_TYPES, file?.type) || !acceptedFileExtension(file)) {
      toast.error('Sorry! We only accept CSV or TSV file types, please upload another file.')
    } else if (file.size > MAX_CSV_SIZE) {
      event.target.value = ''
      return toast(
        <div className="space-y-1">
          <p>The dashboard currently only supports importing of CSVs below 100MB.</p>
          <p>For bulk data loading, we recommend doing so directly through the database.</p>
          <Button asChild type="default" icon={<ExternalLink />} className="!mt-2">
            <Link
              href="https://supabase.com/docs/guides/database/tables#bulk-data-loading"
              target="_blank"
              rel="noreferrer"
            >
              Learn more
            </Link>
          </Button>
        </div>,
        { duration: Infinity }
      )
    } else {
      updateEditorDirty(true)
      setUploadedFile(file)
      const { headers, rowCount, columnTypeMap, errors, previewRows } = await parseSpreadsheet(
        file,
        onProgressUpdate
      )
      if (errors.length > 0) {
        toast.error(
          `Some issues have been detected on ${errors.length} rows. More details below the content preview.`
        )
      }

      setErrors(errors)
      setSelectedHeaders(headers)
      setSpreadsheetData({ headers, rows: previewRows, rowCount, columnTypeMap })
    }
    event.target.value = ''
  }

  const resetSpreadsheetImport = () => {
    setInput('')
    setSpreadsheetData(EMPTY_SPREADSHEET_DATA)
    setUploadedFile(undefined)
    setErrors([])
    updateEditorDirty(false)
  }

  const readSpreadsheetText = async (text: string) => {
    if (text.length > 0) {
      const { headers, rows, columnTypeMap, errors } = await parseSpreadsheetText(text)
      if (errors.length > 0) {
        toast.error(
          `Some issues have been detected on ${errors.length} rows. More details below the content preview.`
        )
      }
      setErrors(errors)
      setSelectedHeaders(headers)
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

  const onToggleHeader = (header: string) => {
    const updatedSelectedHeaders = selectedHeaders.includes(header)
      ? selectedHeaders.filter((h) => h !== header)
      : selectedHeaders.concat([header])
    setSelectedHeaders(updatedSelectedHeaders)
  }

  const onConfirm = (resolve: () => void) => {
    if (tab === 'fileUpload' && uploadedFile === undefined) {
      toast.error('Please upload a file to import your data with')
      resolve()
    } else if (selectedHeaders.length === 0) {
      toast.error('Please select at least one header from your CSV')
      resolve()
    } else if (!isCompatible) {
      toast.error(
        'The data that you are trying to import is incompatible with your table structure'
      )
      resolve()
    } else {
      saveContent({ file: uploadedFile, ...spreadsheetData, selectedHeaders, resolve })
    }
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      align="right"
      header={
        selectedTable !== undefined ? (
          <>
            Add data to{' '}
            <code className="text-sm">
              {selectedTable.schema}.{selectedTable.name}
            </code>
          </>
        ) : (
          'Add content to new table'
        )
      }
      onCancel={() => closePanel()}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel={selectedTable === undefined ? 'Save' : 'Import data'}
          closePanel={closePanel}
          applyFunction={onConfirm}
        />
      }
    >
      <SidePanel.Content>
        <div className="pt-6">
          <Tabs block type="pills" onChange={setTab}>
            <Tabs.Panel id="fileUpload" label="Upload CSV">
              <SpreadSheetFileUpload
                parseProgress={parseProgress}
                uploadedFile={uploadedFile}
                onFileUpload={onFileUpload}
                removeUploadedFile={resetSpreadsheetImport}
              />
            </Tabs.Panel>
            <Tabs.Panel id="pasteText" label="Paste text">
              <SpreadSheetTextInput input={input} onInputChange={onInputChange} />
            </Tabs.Panel>
          </Tabs>
        </div>
      </SidePanel.Content>
      {spreadsheetData.headers.length > 0 && (
        <>
          <div className="pt-4">
            <SidePanel.Separator />
          </div>
          <SpreadsheetImportConfiguration
            spreadsheetData={spreadsheetData}
            selectedHeaders={selectedHeaders}
            onToggleHeader={onToggleHeader}
          />
          <SidePanel.Separator />
          <SpreadsheetImportPreview
            selectedTable={selectedTable}
            spreadsheetData={spreadsheetData}
            errors={errors}
            selectedHeaders={selectedHeaders}
            incompatibleHeaders={incompatibleHeaders}
          />
          <SidePanel.Separator />
        </>
      )}
    </SidePanel>
  )
}

export default SpreadsheetImport
