import { zodResolver } from '@hookform/resolvers/zod'
import { PGTriggerCreate } from '@supabase/pg-meta/src/pg-meta-triggers'
import type { PostgresTrigger } from '@supabase/postgres-meta'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form_Shadcn_, SidePanel } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { FormSchema, WebhookFormValues } from './EditHookPanel.constants'
import { FormContents } from './FormContents'
import { useDatabaseTriggerCreateMutation } from '@/data/database-triggers/database-trigger-create-mutation'
import { useDatabaseTriggerUpdateMutation } from '@/data/database-triggers/database-trigger-update-transaction-mutation'
import { tableEditorQueryOptions } from '@/data/table-editor/table-editor-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose, type ConfirmOnCloseModalProps } from '@/hooks/ui/useConfirmOnClose'
import { uuidv4 } from '@/lib/helpers'

export interface EditHookPanelProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

export type HTTPArgument = { id: string; name: string; value: string }

export const isEdgeFunction = ({
  ref,
  restUrlTld,
  url,
}: {
  ref?: string
  restUrlTld?: string
  url: string
}) =>
  url.includes(`https://${ref}.functions.supabase.${restUrlTld}/`) ||
  url.includes(`https://${ref}.supabase.${restUrlTld}/functions/`)

const FORM_ID = 'edit-hook-panel-form'

const parseHeaders = (selectedHook?: PostgresTrigger): HTTPArgument[] => {
  if (typeof selectedHook === 'undefined') {
    return [{ id: uuidv4(), name: 'Content-type', value: 'application/json' }]
  }
  const [, , headers] = selectedHook.function_args
  let parsedHeaders: Record<string, string> = {}

  try {
    parsedHeaders = JSON.parse(headers.replace(/\\"/g, '"'))
  } catch (e) {
    parsedHeaders = {}
  }

  return Object.entries(parsedHeaders).map(([name, value]) => ({
    id: uuidv4(),
    name,
    value,
  }))
}

const parseParameters = (selectedHook?: PostgresTrigger): HTTPArgument[] => {
  if (typeof selectedHook === 'undefined') {
    return [{ id: uuidv4(), name: '', value: '' }]
  }
  const [, , , parameters] = selectedHook.function_args
  let parsedParameters: Record<string, string> = {}

  try {
    parsedParameters = JSON.parse(parameters.replace(/\\"/g, '"'))
  } catch (e) {
    parsedParameters = {}
  }

  return Object.entries(parsedParameters).map(([name, value]) => ({
    id: uuidv4(),
    name,
    value,
  }))
}

export const EditHookPanel = ({ visible, selectedHook, onClose }: EditHookPanelProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isLoadingTable, setIsLoadingTable] = useState(false)

  const { mutate: createDatabaseTrigger, isPending: isCreating } = useDatabaseTriggerCreateMutation(
    {
      onSuccess: (res) => {
        toast.success(`Successfully created new webhook "${res.name}"`)
        onClose()
      },
      onError: (error) => {
        toast.error(`Failed to create webhook: ${error.message}`)
      },
    }
  )

  const { mutate: updateDatabaseTrigger, isPending: isUpdating } = useDatabaseTriggerUpdateMutation(
    {
      onSuccess: (res) => {
        toast.success(`Successfully updated webhook "${res.name}"`)
        onClose()
      },
      onError: (error) => {
        toast.error(`Failed to update webhook: ${error.message}`)
      },
    }
  )

  const isSubmitting = isCreating || isUpdating || isLoadingTable

  const restUrl = project?.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: selectedHook?.name ?? '',
      table_id: selectedHook?.table_id?.toString() ?? '',
      http_url: selectedHook?.function_args?.[0] ?? '',
      http_method: (selectedHook?.function_args?.[1] as 'GET' | 'POST') ?? 'POST',
      function_type: isEdgeFunction({
        ref,
        restUrlTld,
        url: selectedHook?.function_args?.[0] ?? '',
      })
        ? 'supabase_function'
        : 'http_request',
      timeout_ms: Number(selectedHook?.function_args?.[4] ?? 5000),
      events: selectedHook?.events ?? [],
      httpHeaders: parseHeaders(selectedHook),
      httpParameters: parseParameters(selectedHook),
    },
  })

  // Reset form when panel opens with new selectedHook
  useEffect(() => {
    if (visible) {
      form.reset({
        name: selectedHook?.name ?? '',
        table_id: selectedHook?.table_id?.toString() ?? '',
        http_url: selectedHook?.function_args?.[0] ?? '',
        http_method: (selectedHook?.function_args?.[1] as 'GET' | 'POST') ?? 'POST',
        function_type: isEdgeFunction({
          ref,
          restUrlTld,
          url: selectedHook?.function_args?.[0] ?? '',
        })
          ? 'supabase_function'
          : 'http_request',
        timeout_ms: Number(selectedHook?.function_args?.[4] ?? 5000),
        events: selectedHook?.events ?? [],
        httpHeaders: parseHeaders(selectedHook),
        httpParameters: parseParameters(selectedHook),
      })
    }
  }, [visible, selectedHook, ref, restUrlTld, form])

  const queryClient = useQueryClient()
  const onSubmit: SubmitHandler<WebhookFormValues> = async (values) => {
    if (!project?.ref) {
      return console.error('Project ref is required')
    }

    try {
      setIsLoadingTable(true)
      const selectedTable = await queryClient.fetchQuery(
        tableEditorQueryOptions({
          id: Number(values.table_id),
          projectRef: project?.ref,
          connectionString: project?.connectionString,
        })
      )
      if (!selectedTable) {
        return toast.error('Unable to find selected table')
      }

      const headers = values.httpHeaders
        .filter((header) => header.name && header.value)
        .reduce(
          (a, b) => {
            a[b.name] = b.value
            return a
          },
          {} as Record<string, string>
        )
      const parameters = values.httpParameters
        .filter((param) => param.name && param.value)
        .reduce(
          (a, b) => {
            a[b.name] = b.value
            return a
          },
          {} as Record<string, string>
        )

      // replacer function with JSON.stringify to handle quotes properly
      const stringifiedParameters = JSON.stringify(parameters, (key, value) => {
        if (typeof value === 'string') {
          // Return the raw string without any additional escaping
          return value
        }
        return value
      })

      const payload: PGTriggerCreate = {
        events: values.events,
        activation: 'AFTER',
        orientation: 'ROW',
        name: values.name,
        table: selectedTable.name,
        schema: selectedTable.schema,
        function_name: 'http_request',
        function_schema: 'supabase_functions',
        function_args: [
          values.http_url,
          values.http_method,
          JSON.stringify(headers),
          stringifiedParameters,
          values.timeout_ms.toString(),
        ],
      }

      if (selectedHook === undefined) {
        createDatabaseTrigger({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          payload,
        })
      } else {
        updateDatabaseTrigger({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          originalTrigger: selectedHook,
          updatedTrigger: { ...payload, enabled_mode: 'ORIGIN' },
        })
      }
    } catch (error) {
      console.error('Failed to get table editor:', error)
      toast.error('Failed to get table editor')
    } finally {
      setIsLoadingTable(false)
    }
  }

  // This is intentionally kept outside of the useConfirmOnClose hook to force RHF to update the isDirty state.
  const isDirty = form.formState.isDirty
  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: () => onClose(),
  })

  return (
    <>
      <SidePanel
        size="xlarge"
        visible={visible}
        header={
          selectedHook === undefined ? (
            'Create a new database webhook'
          ) : (
            <>
              Update webhook <code className="text-sm">{selectedHook.name}</code>
            </>
          )
        }
        className="hooks-sidepanel mr-0 transform transition-all duration-300 ease-in-out"
        onConfirm={() => {}}
        onCancel={confirmOnClose}
        customFooter={
          <div className="flex w-full justify-end space-x-3 border-t border-default px-3 py-4">
            <Button
              size="tiny"
              type="default"
              htmlType="button"
              onClick={confirmOnClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="tiny"
              type="primary"
              htmlType="submit"
              form={FORM_ID}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {selectedHook === undefined ? 'Create webhook' : 'Update webhook'}
            </Button>
          </div>
        }
      >
        <Form_Shadcn_ {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <FormContents form={form} selectedHook={selectedHook} />
          </form>
        </Form_Shadcn_>
      </SidePanel>
      <CloseConfirmationModal {...closeConfirmationModalProps} />
    </>
  )
}

const CloseConfirmationModal = ({ visible, onClose, onCancel }: ConfirmOnCloseModalProps) => (
  <ConfirmationModal
    visible={visible}
    title="Discard changes"
    confirmLabel="Discard"
    onCancel={onCancel}
    onConfirm={onClose}
  >
    <p className="text-sm text-foreground-light">
      There are unsaved changes. Are you sure you want to close the panel? Your changes will be
      lost.
    </p>
  </ConfirmationModal>
)
