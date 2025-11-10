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
import { useIsAnalyticsBucketsEnabled } from 'data/config/project-storage-config-query'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useAnalyticsBucketCreateMutation } from 'data/storage/analytics-bucket-create-mutation'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
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
import { inverseValidBucketNameRegex, validBucketNameRegex } from '../CreateBucketModal.utils'
import { BUCKET_TYPES } from '../Storage.constants'
import { useIcebergWrapperExtension } from './AnalyticsBucketDetails/useIcebergWrapper'

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

const formId = 'create-analytics-storage-bucket-form'

export type CreateAnalyticsBucketForm = z.infer<typeof FormSchema>

interface CreateAnalyticsBucketModalProps {
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

export const CreateAnalyticsBucketModal = ({
  buttonSize = 'tiny',
  buttonType = 'default',
  buttonClassName,
  disabled = false,
  tooltip,
}: CreateAnalyticsBucketModalProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const { extension: wrappersExtension, state: wrappersExtensionState } =
    useIcebergWrapperExtension()

  const [visible, setVisible] = useState(false)

  const { data: buckets = [] } = useAnalyticsBucketsQuery({ projectRef: ref })
  const icebergCatalogEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })
  const wrappersExtenstionNeedsUpgrading = wrappersExtensionState === 'needs-upgrade'

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutateAsync: createAnalyticsBucket, isLoading: isCreatingAnalyticsBucket } =
    useAnalyticsBucketCreateMutation({
      // [Joshen] Silencing the error here as it's being handled in onSubmit
      onError: () => {},
    })

  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const config = BUCKET_TYPES['analytics']
  const isCreating = isEnablingExtension || isCreatingIcebergWrapper || isCreatingAnalyticsBucket

  const form = useForm<CreateAnalyticsBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '' },
  })

  const onSubmit: SubmitHandler<CreateAnalyticsBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project details is required')
    if (!wrappersExtension) return console.error('Unable to find wrappers extension')

    const hasExistingBucket = buckets.some((x) => x.id === values.name)
    if (hasExistingBucket) return toast.error('Bucket name already exists')

    try {
      await createAnalyticsBucket({
        projectRef: ref,
        bucketName: values.name,
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

      sendEvent({
        action: 'storage_bucket_created',
        properties: { bucketType: 'analytics' },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      form.reset()
      toast.success(`Created bucket “${values.name}”`)
      setVisible(false)
      router.push(`/project/${ref}/storage/analytics/buckets/${values.name}`)
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

      <DialogContent size="large" aria-describedby={undefined}>
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

              {wrappersExtenstionNeedsUpgrading ? (
                <Admonition
                  type="warning"
                  title="Wrappers extension must be updated for Iceberg Wrapper support"
                >
                  <p className="prose max-w-full text-sm !leading-normal">
                    Update the <code className="text-xs">wrappers</code> extension by disabling and
                    enabling it in{' '}
                    <InlineLink href={`/project/${ref}/database/extensions?filter=wrappers`}>
                      database extensions
                    </InlineLink>{' '}
                    before creating an Analytics bucket.{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}>
                      Learn more
                    </InlineLink>
                    .
                  </p>
                </Admonition>
              ) : (
                <Admonition type="default">
                  <p className="!leading-normal">
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
          <Button
            form={formId}
            htmlType="submit"
            loading={isCreating}
            disabled={wrappersExtenstionNeedsUpgrading || isCreating}
          >
            Create bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
