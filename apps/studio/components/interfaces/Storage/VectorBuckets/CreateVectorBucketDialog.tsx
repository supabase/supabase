import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Box, Plus } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useVectorBucketCreateMutation } from 'data/storage/vector-bucket-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
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
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex, validBucketNameRegex } from '../CreateBucketModal.utils'

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

const formId = 'create-storage-bucket-form'

export type CreateBucketForm = z.infer<typeof FormSchema>

export const CreateVectorBucketDialog = () => {
  const { ref } = useParams()
  const { mutate: createVectorBucket, isLoading: isCreating } = useVectorBucketCreateMutation()
  const [visible, setVisible] = useState(false)
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
    },
  })

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    try {
      await createVectorBucket({
        projectRef: ref,
        bucketName: values.name,
      })

      toast.success(`Successfully created vector bucket ${values.name}`)
      form.reset()

      setVisible(false)
    } catch (error: any) {
      // For other errors, show a toast as fallback
      toast.error(`Failed to create bucket: ${error.message}`)
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
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          block
          size="tiny"
          type="primary"
          className="w-fit"
          icon={<Plus size={14} />}
          disabled={!canCreateBuckets}
          onClick={() => setVisible(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateBuckets
                ? 'You need additional permissions to create buckets'
                : undefined,
            },
          }}
        >
          New bucket
        </ButtonTooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create vector bucket</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection>
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Bucket name"
                    labelOptional="Cannot be changed after creation"
                    description="Must be between 3–63 characters. Valid characters are a-z, 0-9, hyphens (-), and periods (.). A target schema will be created that matches this name."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="name"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        data-bwignore
                        {...field}
                        placeholder="Enter bucket name"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogSectionSeparator />
            <DialogSection>
              <span className="text-sm text-foreground leading-normal">Required integrations</span>
              <div className="flex flex-row space-y-3">
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-shrink-0 mt-1">
                    <Box />
                  </div>
                </div>
                <p className="text-sm text-foreground-light">
                  S3 Vectors Wrapper will be installed on your behalf. This integration is required
                  for querying analytics data.{' '}
                  <a
                    href="https://supabase.com/docs/guides/storage/vector"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button type="default" disabled={isCreating} onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isCreating} disabled={isCreating}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
