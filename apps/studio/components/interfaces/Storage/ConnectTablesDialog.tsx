import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
} from 'ui'
import { inverseValidBucketNameRegex, validBucketNameRegex } from './CreateBucketModal.utils'

const FormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Please provide a name for your bucket')
      .max(100, 'Bucket name should be below 100 characters')
      .refine(
        (value) => !value.endsWith(' '),
        'The name of the bucket cannot end with a whitespace'
      )
      .refine(
        (value) => value !== 'public',
        '"public" is a reserved name. Please choose another name'
      ),
  })
  .superRefine((data, ctx) => {
    if (!validBucketNameRegex.test(data.name)) {
      const [match] = data.name.match(inverseValidBucketNameRegex) ?? []
      ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: !!match
          ? `Bucket name cannot contain the "${match}" character`
          : 'Bucket name contains an invalid special character',
      })
    }
  })

const formId = 'connect-tables-form'

export type ConnectTablesForm = z.infer<typeof FormSchema>

interface ConnectTablesDialogProps {}

export const ConnectTablesDialog = ({}: ConnectTablesDialogProps) => {
  // Temporary loading state before muteAsync is implemented
  const isConnecting = false
  const [visible, setVisible] = useState(false)

  const form = useForm<ConnectTablesForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '' },
  })

  const onSubmit: SubmitHandler<ConnectTablesForm> = async (values) => {
    try {
      toast.success(`Connected tables “${values.name}”`)
      form.reset()
      setVisible(false)
    } catch (error: any) {
      toast.error(`Failed to connect tables: ${error.message}`)
    }
  }

  const handleClose = () => {
    form.reset()
    setVisible(false)
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="tiny"
          type="primary"
          icon={<Plus size={14} />}
          onClick={() => setVisible(true)}
        >
          Connect tables
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect tables</DialogTitle>
        </DialogHeader>

        {/* <DialogSectionSeparator /> */}

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-4">
              <p className="text-sm">
                Select the database tables you would like to send data from. A destination analytics
                table will be created for each, and data will replicate automatically.
              </p>
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button type="default" disabled={isConnecting} onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isConnecting} disabled={isConnecting}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
