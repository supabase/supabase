import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input, TextArea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { STORED_SECRET_PLACEHOLDER } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'

export const BigQueryFields = ({
  form,
  editMode,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}) => {
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
              label="Project ID"
              description="The Google Cloud project ID where data will be sent"
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
              label="Dataset ID"
              layout="horizontal"
              description="The BigQuery dataset where replicated tables will be created"
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
              label="Service Account Key"
              description={
                editMode
                  ? 'Stored credentials are hidden. Enter new credentials to replace them.'
                  : 'Service account credentials JSON for authenticating with BigQuery'
              }
            >
              <FormControl>
                <TextArea
                  {...field}
                  rows={5}
                  maxLength={5000}
                  placeholder={
                    editMode
                      ? STORED_SECRET_PLACEHOLDER
                      : '{"type": "service_account", "project_id": "...", ...}'
                  }
                  className="font-mono text-xs"
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}
