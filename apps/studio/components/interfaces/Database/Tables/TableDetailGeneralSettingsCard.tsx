import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, Form, FormControl, FormField } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import type { TableLike } from '@/data/table-editor/table-editor-types'
import { useTableUpdateMutation } from '@/data/tables/table-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  comment: z.string(),
})

type FormValues = z.infer<typeof FormSchema>

interface TableDetailGeneralSettingsCardProps {
  table: TableLike
}

export function TableDetailGeneralSettingsCard({ table }: TableDetailGeneralSettingsCardProps) {
  const { data: project } = useSelectedProjectQuery()
  const { can: canUpdateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: table.name,
      comment: table.comment ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      name: table.name,
      comment: table.comment ?? '',
    })
  }, [form, table.comment, table.name])

  const { mutate: updateTable, isPending } = useTableUpdateMutation({
    onSuccess: () => {
      toast.success('Table updated')
    },
  })

  const onSubmit = (values: FormValues) => {
    if (!project?.ref) return

    const payload: { name?: string; comment?: string } = {}
    if (values.name.trim() !== table.name) payload.name = values.name.trim()
    if (values.comment.trim() !== (table.comment ?? '')) {
      payload.comment = values.comment.trim()
    }

    if (Object.keys(payload).length === 0) return

    updateTable({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: table.id,
      name: table.name,
      schema: table.schema,
      payload,
    })
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout
                  label="Name"
                  layout="flex-row-reverse"
                  description="The table identifier."
                >
                  <FormControl>
                    <Input {...field} className="w-full max-w-md" disabled={!canUpdateTables} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>
          <CardContent>
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItemLayout
                  label="Description"
                  layout="flex-row-reverse"
                  description="An optional note about this table."
                >
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Optional"
                      className="w-full max-w-md"
                      disabled={!canUpdateTables}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {form.formState.isDirty && (
              <Button type="button" variant="default" onClick={() => form.reset()}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              disabled={!canUpdateTables || !form.formState.isDirty}
            >
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
