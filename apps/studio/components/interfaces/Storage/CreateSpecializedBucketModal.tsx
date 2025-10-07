import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { snakeCase } from 'lodash'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useIcebergWrapperExtension } from 'components/interfaces/Storage/AnalyticBucketDetails/useIcebergWrapper'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
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
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex, validBucketNameRegex } from './CreateBucketModal.utils'
import { BUCKET_TYPES } from './Storage.constants'

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

const formId = 'create-specialized-storage-bucket-form'

export type CreateSpecializedBucketForm = z.infer<typeof FormSchema>

interface CreateSpecializedBucketModalProps {
  bucketType: 'analytics' | 'vectors'
  buttonSize?: 'tiny' | 'small'
  buttonType?: 'default' | 'primary'
  buttonClassName?: string
  label?: string
}

export const CreateSpecializedBucketModal = ({
  bucketType,
  buttonSize = 'tiny',
  buttonType = 'default',
  buttonClassName,
  label,
}: CreateSpecializedBucketModalProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const [visible, setVisible] = useState(false)

  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutateAsync: createBucket, isLoading: isCreating } = useBucketCreateMutation({
    // [Joshen] Silencing the error here as it's being handled in onSubmit
    onError: () => {},
  })
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const icebergWrapperExtensionState = useIcebergWrapperExtension()
  const icebergCatalogEnabled = data?.features?.icebergCatalog?.enabled

  const config = BUCKET_TYPES[bucketType]
  const bucketTypeLabel = label || `New ${config.label}`

  const form = useForm<CreateSpecializedBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
    },
  })

  const bucketName = snakeCase(form.watch('name'))

  const onSubmit: SubmitHandler<CreateSpecializedBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    // Determine bucket type based on the bucketType prop
    const bucketTypeValue = bucketType === 'analytics' ? 'ANALYTICS' : 'VECTORS'

    if (bucketType === 'analytics' && !icebergCatalogEnabled) {
      return toast.error(
        'The Analytics catalog feature is not enabled for your project. Please contact support to enable it.'
      )
    }

    try {
      await createBucket({
        projectRef: ref,
        id: values.name,
        type: bucketTypeValue,
        isPublic: false, // Specialized buckets are not public by default
        file_size_limit: undefined, // Specialized buckets do not have a file size limit
        allowed_mime_types: undefined, // Specialized buckets do not have allowed MIME types
      })

      sendEvent({
        action: 'storage_bucket_created',
        properties: { bucketType: bucketTypeValue },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      // Create iceberg wrapper for analytics buckets if extension is installed
      if (bucketType === 'analytics' && icebergWrapperExtensionState === 'installed') {
        await createIcebergWrapper({ bucketName: values.name })
      }

      toast.success(`Successfully created ${config.label} ${values.name}`)
      form.reset()
      setVisible(false)
      router.push(`/project/${ref}/storage/${bucketType}/${values.name}`)
    } catch (error: any) {
      toast.error(`Failed to create ${config.label}: ${error.message}`)
    }
  }

  const handleClose = () => {
    form.reset()
    setVisible(false)
  }

  // Check if required integration is installed
  const isRequiredIntegrationInstalled =
    bucketType === 'analytics' ? icebergWrapperExtensionState === 'installed' : true // Vector integration check would go here when available

  const getIntegrationAlert = () => {
    if (bucketType === 'analytics' && icebergWrapperExtensionState !== 'installed') {
      return (
        <Alert_Shadcn_ variant="warning">
          <WarningIcon />
          <AlertTitle_Shadcn_>
            You need to install the Iceberg wrapper extension to connect your Analytics bucket to
            your database.
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
            <p>
              You need to install the <span className="text-brand">wrappers</span> extension (with
              the minimum version of <span>0.5.3</span>) if you want to connect your Analytics
              bucket to your database.
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )
    }

    if (bucketType === 'vectors') {
      // Placeholder for vector integration check when available
      return null
    }

    return null
  }

  const getIntegrationSuccessMessage = () => {
    if (bucketType === 'analytics' && icebergWrapperExtensionState === 'installed') {
      return <p>Placeholder for vector integration success message when available</p>
    }

    return null
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
          size={buttonSize}
          type={buttonType}
          className={buttonClassName}
          icon={<Plus size={14} />}
          disabled={!canCreateBuckets}
          style={{ justifyContent: 'start' }}
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
          {bucketTypeLabel}
        </ButtonTooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create {config.label}</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-2">
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Name of bucket"
                    labelOptional="Cannot be changed after creation"
                    description="Must be between 3–63 characters. Only lowercase letters, numbers, dots, and hyphens are allowed."
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

            <DialogSection className="space-y-3">
              {getIntegrationAlert()}
              {getIntegrationSuccessMessage()}
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button
            type="default"
            disabled={isCreating || isCreatingIcebergWrapper}
            onClick={() => setVisible(false)}
          >
            Cancel
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            loading={isCreating || isCreatingIcebergWrapper}
            disabled={isCreating || isCreatingIcebergWrapper}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
