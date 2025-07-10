import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export interface ImportForeignSchemaDialogProps {
  bucketName: string
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  bucketName: z.string().trim(),
  source_namespace: z.string().trim(),
  target_schema: z.string().trim(),
})

export type ImportForeignSchemaForm = z.infer<typeof FormSchema>

export const ImportForeignSchemaDialog = ({
  bucketName,
  visible,
  onClose,
}: ImportForeignSchemaDialogProps) => {
  const { project } = useProjectContext()
  const { ref } = useParams()

  const { mutate, isLoading } = useFDWImportForeignSchemaMutation({
    onSuccess: () => {
      toast.success(`Successfully connected ${bucketName} to the database.`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to connect bucket to the database: ${error.message}`)
    },
  })

  const form = useForm<ImportForeignSchemaForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bucketName,
      source_namespace: 'default',
      target_schema: 'public',
    },
  })

  const onSubmit: SubmitHandler<ImportForeignSchemaForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    mutate({
      projectRef: ref,
      connectionString: project?.connectionString,
      serverName: `${snakeCase(values.bucketName)}_fdw_server`,
      sourceSchema: values.source_namespace,
      targetSchema: values.target_schema,
    })
  }

  useEffect(() => {
    if (visible) {
      form.reset({
        bucketName,
        source_namespace: 'default',
        target_schema: 'public',
      })
    }
  }, [visible, form])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header={
        <span>
          Set namespace for <span className="text-brand">{bucketName}</span> bucket
        </span>
      }
      onCancel={() => onClose()}
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Modal.Content className="flex flex-col gap-y-4">
            <FormField_Shadcn_
              control={form.control}
              name="source_namespace"
              render={({ field }) => (
                <FormItemLayout
                  label="Namespace"
                  description="Should match the namespace name when uploading data."
                  layout="vertical"
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="Enter namespace name" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="target_schema"
              render={({ field }) => (
                <FormItemLayout
                  label="Target Schema"
                  description="Database schema in which the Iceberg data will be shown."
                  layout="vertical"
                >
                  <SchemaSelector
                    portal={false}
                    size="small"
                    selectedSchemaName={field.value}
                    onSelectSchema={(schema) => field.onChange(schema)}
                  />
                </FormItemLayout>
              )}
            />
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content className="flex items-center space-x-2 justify-end">
            <Button type="default" htmlType="button" disabled={isLoading} onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Save
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}
