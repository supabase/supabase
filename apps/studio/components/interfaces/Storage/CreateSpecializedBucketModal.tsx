import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, IS_PLATFORM } from 'lib/constants'
import {
  Button,
  cn,
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
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useIcebergWrapperExtension } from './AnalyticBucketDetails/useIcebergWrapper'
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
  disabled?: boolean
  tooltip?: {
    content: {
      side?: 'top' | 'bottom' | 'left' | 'right'
      text?: string
    }
  }
}

export const CreateSpecializedBucketModal = ({
  bucketType,
  buttonSize = 'tiny',
  buttonType = 'default',
  buttonClassName,
  disabled = false,
  tooltip,
}: CreateSpecializedBucketModalProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const { extension: wrappersExtension, state: wrappersExtensionState } =
    useIcebergWrapperExtension()

  const [visible, setVisible] = useState(false)

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const icebergCatalogEnabled = data?.features?.icebergCatalog?.enabled

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutateAsync: createBucket, isLoading: isCreatingBucket } = useBucketCreateMutation({
    // [Joshen] Silencing the error here as it's being handled in onSubmit
    onError: () => {},
  })
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()
  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const config = BUCKET_TYPES['analytics']
  const isCreating = isCreatingBucket || isEnablingExtension || isCreatingIcebergWrapper

  const form = useForm<CreateSpecializedBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
    },
  })

  const onSubmit: SubmitHandler<CreateSpecializedBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project details is required')
    if (!wrappersExtension) return console.error('Unable to find wrappers extension')

    if (wrappersExtensionState === 'needs-upgrade') {
      // [Joshen] Double check if this is the right CTA
      return toast.error(
        <p className="prose max-w-full text-sm">
          Wrappers extensions needs to be updated to create an Iceberg Wrapper. Update the extension
          by disabling and enabling the <code className="text-xs">wrappers</code> extension first in
          the{' '}
          <InlineLink href={`/project/${ref}/database/extensions?filter=wrappers`}>
            database extensions page
          </InlineLink>{' '}
          before creating an Analytics bucket.
        </p>
      )
    }

    // Determine bucket type based on the bucketType prop
    // [Danny] Change STANDARD to VECTORS when ready
    const bucketTypeValue = bucketType === 'analytics' ? 'ANALYTICS' : 'STANDARD'

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

      if (wrappersExtensionState === 'not-installed') {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: wrappersExtension.name,
          schema: wrappersExtension.schema ?? 'extensions',
          version: wrappersExtension.default_version,
        })
        await createIcebergWrapper({ bucketName: values.name })
      } else if (wrappersExtensionState === 'installed') {
        await createIcebergWrapper({ bucketName: values.name })
      }

      toast.success(`Created bucket “${values.name}”`)
      form.reset()
      setVisible(false)
      router.push(`/project/${ref}/storage/${bucketType}/${values.name}`)
    } catch (error: any) {
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
        if (!open) handleClose()
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          block
          size={buttonSize}
          type={buttonType}
          className={buttonClassName}
          icon={<Plus size={14} />}
          disabled={!canCreateBuckets || !icebergCatalogEnabled || disabled}
          style={{ justifyContent: 'start' }}
          onClick={() => setVisible(true)}
          tooltip={{
            content: {
              side: tooltip?.content?.side || 'bottom',
              className: cn(!icebergCatalogEnabled ? 'w-72 text-center' : ''),
              text: !icebergCatalogEnabled
                ? 'Analytics buckets are not enabled for your project. Please contact support to enable it.'
                : !canCreateBuckets
                  ? 'You need additional permissions to create buckets'
                  : tooltip?.content?.text,
            },
          }}
        >
          New bucket
        </ButtonTooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create {config.singularName} bucket</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-4">
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Bucket name"
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

              {bucketType === 'analytics' && (
                <Admonition type="default">
                  <p>
                    Supabase will install the{' '}
                    {wrappersExtensionState !== 'installed' ? 'Wrappers extension and ' : ''}
                    Iceberg Wrapper integration on your behalf.{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}>
                      Learn more
                    </InlineLink>
                    .
                  </p>
                </Admonition>
              )}
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
