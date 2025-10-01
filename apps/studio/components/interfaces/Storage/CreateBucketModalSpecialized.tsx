import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { snakeCase } from 'lodash'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useIcebergWrapperExtension } from 'components/interfaces/Storage/AnalyticBucketDetails/useIcebergWrapper'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
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
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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
    // Basic validation for bucket names
    const validBucketNameRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/
    if (!validBucketNameRegex.test(data.name)) {
      ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: 'Bucket name can only contain lowercase letters, numbers, and hyphens',
      })
    }
  })

const formId = 'create-specialized-bucket-form'

export type CreateSpecializedBucketForm = z.infer<typeof FormSchema>

interface CreateBucketModalSpecializedProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  bucketType: 'ANALYTICS' | 'VECTORS'
}

export const CreateBucketModalSpecialized = ({
  visible,
  onOpenChange,
  bucketType,
}: CreateBucketModalSpecializedProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutateAsync: createBucket, isLoading: isCreating } = useBucketCreateMutation({
    onError: () => {},
  })
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const icebergWrapperExtensionState = useIcebergWrapperExtension()
  const icebergCatalogEnabled = data?.features?.icebergCatalog?.enabled

  const form = useForm<CreateSpecializedBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
    },
  })

  const bucketName = snakeCase(form.watch('name'))

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      form.reset({
        name: '',
      })
    }
  }, [visible, form])

  const onSubmit: SubmitHandler<CreateSpecializedBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    if (bucketType === 'ANALYTICS' && !icebergCatalogEnabled) {
      return toast.error(
        'The Analytics catalog feature is not enabled for your project. Please contact support to enable it.'
      )
    }

    try {
      await createBucket({
        projectRef: ref,
        id: values.name,
        type: bucketType === 'VECTORS' ? 'ANALYTICS' : bucketType,
        isPublic: false, // Specialized buckets are always private
        file_size_limit: undefined,
        allowed_mime_types: undefined,
      })
      sendEvent({
        action: 'storage_bucket_created',
        properties: { bucketType },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      if (bucketType === 'ANALYTICS' && icebergWrapperExtensionState === 'installed') {
        await createIcebergWrapper({ bucketName: values.name })
      }

      toast.success(`Successfully created ${bucketType.toLowerCase()} bucket ${values.name}`)
      form.reset()
      onOpenChange(false)
      router.push(`/project/${ref}/storage/buckets/${values.name}`)
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || ''
      if (errorMessage.includes('already exists')) {
        form.setError('name', {
          type: 'manual',
          message: 'A bucket with this name already exists',
        })
      } else if (errorMessage.includes('invalid name')) {
        form.setError('name', {
          type: 'manual',
          message: 'Invalid bucket name',
        })
      } else {
        toast.error(`Failed to create bucket: ${error.message}`)
      }
    }
  }

  if (!canCreateBuckets) {
    return null
  }

  const bucketTypeDisplayName = bucketType === 'ANALYTICS' ? 'Analytics' : 'Vectors'

  return (
    <Dialog open={visible} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create a new {bucketTypeDisplayName.toLowerCase()} bucket</DialogTitle>
            </DialogHeader>

            <DialogSection>
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Name"
                    description="This is the name of your bucket. It cannot be changed after creation."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        placeholder="e.g my-awesome-bucket"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              {/* Integration notice */}
              {bucketType === 'ANALYTICS' && icebergWrapperExtensionState !== 'installed' && (
                <Alert_Shadcn_ variant="default">
                  <AlertTitle_Shadcn_>Required integrations</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    Iceberg Wrapper will be installed on your behalf. This integration is required
                    for querying analytics data. Learn more
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}

              {bucketType === 'VECTORS' && icebergWrapperExtensionState !== 'installed' && (
                <Alert_Shadcn_ variant="default">
                  <AlertTitle_Shadcn_>Required integrations</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    S3 Vectors Wrapper will be installed on your behalf. This integration is
                    required for querying analytics data. Learn more
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
            </DialogSection>

            <DialogSectionSeparator />

            <DialogFooter>
              <Button type="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isCreatingIcebergWrapper}
                disabled={isCreating || isCreatingIcebergWrapper}
              >
                Create {bucketTypeDisplayName.toLowerCase()} bucket
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
