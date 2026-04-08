import type { PostgresTable } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { noop } from 'lodash'
import { useCallback, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'sonner'
import { SidePanel, Tabs } from 'ui'

import { ActionBar } from '../ActionBar'
import type { ImportContent } from '../TableEditor/TableEditor.types'
import { SpreadSheetFileUpload } from './SpreadSheetFileUpload'
import SpreadsheetImportConfiguration from './SpreadSheetImportConfiguration'
import { SpreadsheetImportPreview } from './SpreadsheetImportPreview'
import SpreadSheetTextInput from './SpreadSheetTextInput'
import {
  hasAttachedFile,
  hasAttachedText,
  isEmptyState,
  isFileTab,
  isParsedState,
  isParsingState,
  useSpreadsheetImport,
} from './useSpreadsheetImport'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface SpreadsheetImportProps {
  visible: boolean
  selectedTable?: PostgresTable
  saveContent: (prefillData: ImportContent) => void
  closePanel: () => void
  updateEditorDirty?: (value: boolean) => void
}

export const SpreadsheetImport = ({
  visible = false,
  selectedTable,
  saveContent,
  closePanel,
  updateEditorDirty = noop,
}: SpreadsheetImportProps) => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const {
    state,
    handleSwitchTab,
    handleSetEmptyStringAsNullHeaders,
    handleInputText,
    handleUploadFile,
    handleRemoveFile,
    handleToggleSelectedHeader,
  } = useSpreadsheetImport({ markDirty: updateEditorDirty })
  const tab = isFileTab(state) ? 'fileUpload' : 'pasteText'

  const selectedTableColumns = (selectedTable?.columns ?? []).map((column) => column.name)
  const selectedHeaders =
    state._tag === 'file_parsed' || state._tag === 'text_parsed' ? state.selectedHeaders : []
  const incompatibleHeaders = selectedHeaders.filter(
    (header) => !selectedTableColumns.includes(header)
  )
  const isCompatible = !selectedTable || incompatibleHeaders.length === 0

  const { mutate: sendEvent } = useSendEventMutation()
  const onConfirm = (resolve: () => void) => {
    if (state._tag === 'no_selected_file') {
      toast.error('Please upload a file to import your data with')
      resolve()
    } else if (state._tag === 'no_pasted_text') {
      toast.error('Please paste some CSV text to import')
      resolve()
    } else if (state._tag === 'parsing_file' || state._tag === 'parsing_text') {
      toast.error('Your data is still being processed, please wait a moment')
      resolve()
    } else if (state.selectedHeaders.length === 0) {
      toast.error('Please select at least one header from your CSV')
      resolve()
    } else if (!isCompatible) {
      toast.error(
        'The data that you are trying to import is incompatible with your table structure'
      )
      resolve()
    } else {
      saveContent({
        file: state._tag === 'file_parsed' ? state.file : undefined,
        ...state.data,
        selectedHeaders: state.selectedHeaders,
        emptyStringAsNullHeaders: state.emptyStringAsNullHeaders,
        resolve,
      })
      sendEvent({
        action: 'import_data_added',
        groups: { project: projectRef ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })
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
            Add data to <code className="text-sm ml-1">{selectedTable.name}</code>
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
          <Tabs block type="pills" activeId={tab} onChange={handleSwitchTab}>
            <Tabs.Panel id="fileUpload" label="Upload CSV">
              <SpreadsheetFileDropZone
                file={hasAttachedFile(state) ? state.file : undefined}
                parseProgress={
                  isEmptyState(state) ? 0 : isParsingState(state) ? state.progress : 100
                }
                onUploadFile={handleUploadFile}
                onRemoveFile={handleRemoveFile}
              />
            </Tabs.Panel>
            <Tabs.Panel id="pasteText" label="Paste text">
              <SpreadsheetInputZone
                text={hasAttachedText(state) ? state.text : ''}
                onInputChange={handleInputText}
              />
            </Tabs.Panel>
          </Tabs>
        </div>
      </SidePanel.Content>
      {isParsedState(state) && state.data.headers.length > 0 && (
        <>
          <div className="pt-4">
            <SidePanel.Separator />
          </div>
          <SpreadsheetImportConfiguration
            spreadsheetData={state.data}
            selectedHeaders={state.selectedHeaders}
            onToggleHeader={handleToggleSelectedHeader}
            emptyStringAsNullHeaders={state.emptyStringAsNullHeaders}
            onEmptyStringAsNullHeadersChange={handleSetEmptyStringAsNullHeaders}
          />
          <SidePanel.Separator />
          <SpreadsheetImportPreview
            selectedTable={selectedTable}
            spreadsheetData={state.data}
            errors={state.errors}
            selectedHeaders={state.selectedHeaders}
            incompatibleHeaders={incompatibleHeaders}
            emptyStringAsNullHeaders={state.emptyStringAsNullHeaders}
          />
          <SidePanel.Separator />
        </>
      )}
    </SidePanel>
  )
}

function isDragEvent(
  event: DragEvent<HTMLDivElement> | ChangeEvent<HTMLInputElement>
): event is DragEvent<HTMLDivElement> {
  return event.type === 'drop'
}

interface SpreadsheetFileDropZoneProps {
  file: File | undefined
  parseProgress: number
  onUploadFile: (file: File) => void
  onRemoveFile: () => void
}

function SpreadsheetFileDropZone({
  file,
  parseProgress,
  onUploadFile,
  onRemoveFile,
}: SpreadsheetFileDropZoneProps) {
  const handleUploadFile = useCallback(
    async function uploadFile(event: DragEvent<HTMLDivElement> | ChangeEvent<HTMLInputElement>) {
      const [file] = isDragEvent(event) ? event.dataTransfer.files : (event.target.files ?? [])
      if (!file) {
        return
      }
      onUploadFile(file)
    },
    [onUploadFile]
  )

  return (
    <SpreadSheetFileUpload
      uploadedFile={file}
      onFileUpload={handleUploadFile}
      parseProgress={parseProgress}
      removeUploadedFile={onRemoveFile}
    />
  )
}

interface SpreadsheetInputZoneProps {
  text: string
  onInputChange: (text: string) => void
}

function SpreadsheetInputZone({ text, onInputChange }: SpreadsheetInputZoneProps) {
  const handleInputText = useCallback(
    function inputText(event: ChangeEvent<HTMLTextAreaElement>) {
      onInputChange(event.target.value)
    },
    [onInputChange]
  )

  return <SpreadSheetTextInput input={text} onInputChange={handleInputText} />
}
