import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const newTableSchema = z.object({
  tableName: z
    .string()
    .min(3, 'Table name must be at least 3 characters')
    .max(63, 'Table name must be less than 64 characters')
    .regex(
      /^[a-z0-9_.]+$/,
      'Table name can only contain lowercase letters, numbers, dots, and underscores'
    ),
  targetSchema: z
    .string()
    .min(1, 'Target schema is required')
    .regex(
      /^[a-z0-9_]+$/,
      'Target schema can only contain lowercase letters, numbers, and underscores'
    )
    .regex(
      /^[a-z0-9_]+$/,
      'Target schema can only contain lowercase letters, numbers, and underscores'
    ),
})

type NewTableFormValues = z.infer<typeof newTableSchema>

interface NewTableModalProps {
  visible: boolean
  onClose: () => void
}

// Mock schema data
const mockSchemas = [
  { value: 'public', label: 'public' },
  { value: 'analytics', label: 'analytics' },
  { value: 'warehouse', label: 'warehouse' },
  { value: 'staging', label: 'staging' },
]

export const NewTableModal = ({ visible, onClose }: NewTableModalProps) => {
  const form = useForm<NewTableFormValues>({
    resolver: zodResolver(newTableSchema),
    defaultValues: {
      tableName: '',
      targetSchema: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const handleCreate = (values: NewTableFormValues) => {
    // TODO: Implement actual table creation logic
    console.log('Creating table:', values)
    // For now, just close the modal
    onClose()
  }

  const handleCancel = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel()
        }
      }}
    >
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Create analytics table</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)}>
            <DialogSection>
              <FormField_Shadcn_
                key="tableName"
                name="tableName"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="tableName"
                    label="Table name"
                    description="Must be between 3–63 characters. Use only lowercase letters, numbers, dots, and underscores."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="tableName"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        data-bwignore
                        {...field}
                        placeholder="Enter table name"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogSectionSeparator />
            <DialogSection>
              <FormField_Shadcn_
                key="targetSchema"
                name="targetSchema"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="targetSchema"
                    label="Target schema"
                    description="Will be used as the table’s namespace. Use only lowercase letters, numbers, and underscores."
                  >
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ placeholder="Select or create a schema" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {/* TODO: We could use SchemaSelector here but those are for database schemas */}
                          {/* Should we use it anyway and only show schemas that are for foreign data? Is that possible? Yes, we can! */}
                          {mockSchemas.map((schema) => (
                            <SelectItem_Shadcn_ key={schema.value} value={schema.value}>
                              {schema.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button type="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
