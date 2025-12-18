import type { PostgresTable } from '@supabase/postgres-meta'
import { debounce, noop } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useChanged } from 'hooks/misc/useChanged'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { SidePanel, Tabs } from 'ui'
import { ActionBar } from '../ActionBar'
import type { ImportContent } from '../TableEditor/TableEditor.types'
import SpreadSheetFileUpload from './SpreadSheetFileUpload'
import SpreadsheetImportConfiguration from './SpreadSheetImportConfiguration'
import SpreadSheetTextInput from './SpreadSheetTextInput'
import { EMPTY_SPREADSHEET_DATA } from './SpreadsheetImport.constants'
import type { SpreadsheetData } from './SpreadsheetImport.types'
import {
  flagInvalidFileImport,
  parseSpreadsheet,
  parseSpreadsheetText,
} from './SpreadsheetImport.utils'
import { SpreadsheetImportPreview } from './SpreadsheetImportPreview'

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

const csvParseErrorMessage =
  'Some issues have been detected. More details below the content preview.'

export const SpreadsheetImport = ({
  visible = false,
  debounceDuration = 250,
  headers = [],
  rows = [],
  selectedTable,
  saveContent,
  closePanel,
  updateEditorDirty = noop,
}: SpreadsheetImportProps) => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()

  const fileFromState =
    tableEditorSnap.sidePanel?.type === 'csv-import' ? tableEditorSnap.sidePanel.file : undefined

  const visiblityChanged = useChanged(visible)
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

  const { mutate: sendEvent } = useSendEventMutation()

  const selectedTableColumns = (selectedTable?.columns ?? []).map((column) => column.name)
  const incompatibleHeaders = selectedHeaders.filter(
    (header) => !selectedTableColumns.includes(header)
  )
  const isCompatible = selectedTable !== undefined ? incompatibleHeaders.length === 0 : true

  const onProgressUpdate = (progress: number) => {
    setParseProgress(progress)
  }

  // Process a file into table rows and columns (used for both upload and drop)
  const processFile = useCallback(
    async (file: File) => {
      updateEditorDirty(true)
      setUploadedFile(file)
      setParseProgress(0)

      const { headers, rowCount, columnTypeMap, errors, previewRows } = await parseSpreadsheet(
        file,
        onProgressUpdate
      )

      if (errors.length > 0) {
        toast.error(csvParseErrorMessage)
      }

      setErrors(errors)
      setSelectedHeaders(headers)
      setSpreadsheetData({ headers, rows: previewRows, rowCount, columnTypeMap })
    },
    [updateEditorDirty]
  )

  // Handle file upload events from file input
  const onFileUpload = useCallback(
    async (event: any) => {
      event.persist()
      const [file] = event.target.files || event.dataTransfer.files
      if (file && !flagInvalidFileImport(file)) {
        await processFile(file)
      }
      event.target.value = ''
    },
    [processFile]
  )

  const resetSpreadsheetImport = useCallback(() => {
    setInput('')
    setSpreadsheetData(EMPTY_SPREADSHEET_DATA)
    setUploadedFile(undefined)
    setErrors([])
    updateEditorDirty(false)
  }, [updateEditorDirty])

  const readSpreadsheetText = async (text: string) => {
    if (text.length > 0) {
      const { headers, rows, columnTypeMap, errors } = await parseSpreadsheetText(text)
      if (errors.length > 0) {
        toast.error(csvParseErrorMessage)
      }
      setErrors(errors)
      setSelectedHeaders(headers)
      setSpreadsheetData({ headers, rows, rowCount: rows.length, columnTypeMap })
    } else {
      setSpreadsheetData(EMPTY_SPREADSHEET_DATA)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handler = useCallback(debounce(readSpreadsheetText, debounceDuration), [])
  const onInputChange = (value: string) => {
    setInput(value)
    handler(value)
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
      sendEvent({
        action: 'import_data_added',
        groups: { project: projectRef ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })
    }
  }

  useEffect(() => {
    if (visiblityChanged && visible) {
      if (fileFromState) processFile(fileFromState)
      else if (headers.length === 0) resetSpreadsheetImport()
    }
  }, [
    visiblityChanged,
    visible,
    fileFromState,
    processFile,
    headers.length,
    resetSpreadsheetImport,
  ])

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
