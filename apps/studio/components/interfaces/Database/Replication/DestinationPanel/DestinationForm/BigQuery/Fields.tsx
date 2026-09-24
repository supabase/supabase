import { Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Button, cn, FormControl, FormField, Input, TextArea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { STORED_SECRET_PLACEHOLDER } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import {
  BIGQUERY_DATASET_ID_FIELD_COPY,
  BIGQUERY_PROJECT_ID_FIELD_COPY,
} from '../DestinationFormFieldCopy'
import { MAX_SERVICE_ACCOUNT_KEY_LENGTH, readServiceAccountFile } from './BigQuery.utils'

export const BigQueryFields = ({
  form,
  editMode,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}) => {
  const serviceAccountFileInputRef = useRef<HTMLInputElement>(null)
  const fileReadRequestIdRef = useRef(0)
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const handleServiceAccountFile = async (file: File | undefined) => {
    if (!file) return
    const requestId = ++fileReadRequestIdRef.current
    await readServiceAccountFile(file, form, () => requestId === fileReadRequestIdRef.current)
  }

  const handleServiceAccountFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    await handleServiceAccountFile(file)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingFile(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingFile(false)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingFile(false)
    await handleServiceAccountFile(event.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">BigQuery settings</p>
      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={BIGQUERY_PROJECT_ID_FIELD_COPY.label}
              description={BIGQUERY_PROJECT_ID_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} placeholder="my-gcp-project" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="datasetId"
          render={({ field }) => (
            <FormItemLayout
              label={BIGQUERY_DATASET_ID_FIELD_COPY.label}
              layout="horizontal"
              description={BIGQUERY_DATASET_ID_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} placeholder="my_dataset" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="serviceAccountKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Service account key"
              description={
                editMode
                  ? 'Stored credentials are hidden. Paste or upload new credentials to replace them.'
                  : 'Paste or upload your service account credentials JSON file for authenticating with BigQuery.'
              }
            >
              <div
                className="relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={cn('space-y-2 transition-opacity', isDraggingFile && 'opacity-40')}>
                  <FormControl>
                    <TextArea
                      {...field}
                      onChange={(event) => {
                        fileReadRequestIdRef.current += 1
                        field.onChange(event)
                      }}
                      rows={5}
                      maxLength={MAX_SERVICE_ACCOUNT_KEY_LENGTH}
                      placeholder={
                        editMode
                          ? STORED_SECRET_PLACEHOLDER
                          : '{"type": "service_account", "project_id": "...", ...}'
                      }
                      className="max-h-[calc(13lh+1rem)] font-mono text-xs"
                    />
                  </FormControl>
                  <input
                    aria-label="Upload service account credentials JSON file"
                    ref={serviceAccountFileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleServiceAccountFileInputChange}
                  />
                  <Button
                    type="button"
                    size="tiny"
                    icon={<Upload size={14} />}
                    onClick={() => serviceAccountFileInputRef.current?.click()}
                  >
                    Upload JSON file
                  </Button>
                </div>
                {isDraggingFile ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-brand-default ring-offset-2 ring-offset-background"
                  />
                ) : null}
              </div>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}
