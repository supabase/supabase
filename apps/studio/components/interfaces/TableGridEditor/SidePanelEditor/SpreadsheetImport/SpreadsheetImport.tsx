import { zodResolver } from '@hookform/resolvers/zod'
import type { PGTable } from '@supabase/pg-meta'
import { noop } from 'lodash'
import { useCallback, useId, type ChangeEvent, type DragEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Form, SidePanel, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import { ActionBar } from '../ActionBar'
import type { ImportContent } from '../TableEditor/TableEditor.types'
import { SpreadSheetFileUpload } from './SpreadSheetFileUpload'
import {
  spreadsheetImportSettingsSchema,
  type SpreadsheetImportSettings,
} from './SpreadsheetImport.types'
import { SpreadsheetImportConfiguration } from './SpreadSheetImportConfiguration'
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
import { useTrack } from '@/lib/telemetry/track'

interface SpreadsheetImportProps {
  visible: boolean
  selectedTable?: PGTable
  saveContent: (prefillData: ImportContent) => void | Promise<void>
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
  const track = useTrack()
  const formId = useId()
  const form = useForm<SpreadsheetImportSettings>({
    resolver: zodResolver(spreadsheetImportSettingsSchema),
    defaultValues: { skipConflictingRows: false },
  })
  const { isSubmitting } = form.formState
  const { getValues } = form
  const skipConflictingRows = useWatch({ control: form.control, name: 'skipConflictingRows' })
  const handleClose = () => {
    if (!isSubmitting) closePanel()
  }
  const markDirty = useCallback(
    (isDirty: boolean) => {
      updateEditorDirty(isDirty || getValues('skipConflictingRows'))
    },
    [getValues, updateEditorDirty]
  )
  const {
    state,
    handleSwitchTab,
    handleSetEmptyStringAsNullHeaders,
    handleInputText,
    handleUploadFile,
    handleRemoveFile,
    handleToggleSelectedHeader,
  } = useSpreadsheetImport({ markDirty })
  const tab = isFileTab(state) ? 'fileUpload' : 'pasteText'

  const selectedTableColumns = (selectedTable?.columns ?? []).map((column) => column.name)
  const selectedHeaders =
    state._tag === 'file_parsed' || state._tag === 'text_parsed' ? state.selectedHeaders : []
  const incompatibleHeaders = selectedHeaders.filter(
    (header) => !selectedTableColumns.includes(header)
  )
  const isCompatible = !selectedTable || incompatibleHeaders.length === 0

  const onConfirm = form.handleSubmit(async (settings) => {
    if (state._tag === 'no_selected_file') {
      toast.error('Please upload a file to import your data with')
    } else if (state._tag === 'no_pasted_text') {
      toast.error('Please paste some CSV text to import')
    } else if (state._tag === 'parsing_file' || state._tag === 'parsing_text') {
      toast.error('Your data is still being processed, please wait a moment')
    } else if (state.selectedHeaders.length === 0) {
      toast.error('Please select at least one header from your CSV')
    } else if (!isCompatible) {
      toast.error(
        'The data that you are trying to import is incompatible with your table structure'
      )
    } else {
      try {
        await saveContent({
          file: state._tag === 'file_parsed' ? state.file : undefined,
          ...state.data,
          selectedHeaders: state.selectedHeaders,
          emptyStringAsNullHeaders: state.emptyStringAsNullHeaders,
          skipConflictingRows: selectedTable !== undefined && settings.skipConflictingRows,
        })
        track('import_data_added')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown import error'
        toast.error(`Failed to import data: ${message}`)
      }
    }
  })

  return (
    <Form {...form}>
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
        onCancel={handleClose}
        customFooter={
          <ActionBar
            backButtonLabel="Cancel"
            applyButtonLabel={selectedTable === undefined ? 'Save' : 'Import data'}
            closePanel={handleClose}
            formId={formId}
            loading={isSubmitting}
            visible={visible}
          />
        }
      >
        <form id={formId} onSubmit={onConfirm}>
          <fieldset disabled={isSubmitting}>
            <SidePanel.Content>
              <div className="pt-6">
                <Tabs value={tab} onValueChange={handleSwitchTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fileUpload">Upload CSV</TabsTrigger>
                    <TabsTrigger value="pasteText">Paste text</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fileUpload">
                    <SpreadsheetFileDropZone
                      file={hasAttachedFile(state) ? state.file : undefined}
                      parseProgress={
                        isEmptyState(state) ? 0 : isParsingState(state) ? state.progress : 100
                      }
                      onUploadFile={handleUploadFile}
                      onRemoveFile={handleRemoveFile}
                    />
                  </TabsContent>
                  <TabsContent value="pasteText">
                    <SpreadsheetInputZone
                      text={hasAttachedText(state) ? state.text : ''}
                      onInputChange={handleInputText}
                    />
                  </TabsContent>
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
                  control={form.control}
                  canSkipConflictingRows={selectedTable !== undefined}
                  isImporting={isSubmitting}
                  onConfigurationChange={() => updateEditorDirty(true)}
                  selectedHeaders={state.selectedHeaders}
                  onToggleHeader={handleToggleSelectedHeader}
                  emptyStringAsNullHeaders={state.emptyStringAsNullHeaders}
                  onEmptyStringAsNullHeadersChange={handleSetEmptyStringAsNullHeaders}
                />
                <SidePanel.Separator />
                <SpreadsheetImportPreview
                  skipConflictingRows={selectedTable !== undefined && skipConflictingRows}
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
          </fieldset>
        </form>
      </SidePanel>
    </Form>
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
