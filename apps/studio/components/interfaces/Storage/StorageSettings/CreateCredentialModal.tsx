import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FormField } from '@ui/components/shadcn/ui/form'
import { useParams } from 'common'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useS3AccessKeyCreateMutation } from 'data/storage/s3-access-key-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsProjectActive } from 'hooks/misc/useSelectedProject'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

interface CreateCredentialModalProps {
  visible: boolean
  onOpenChange: (value: boolean) => void
}

export const CreateCredentialModal = ({ visible, onOpenChange }: CreateCredentialModalProps) => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const [showSuccess, setShowSuccess] = useState(false)

  const { can: canCreateCredentials } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

  const { data: config } = useProjectStorageConfigQuery({ projectRef })
  const isS3ConnectionEnabled = config?.features.s3Protocol.enabled
  const disableCreation = !isProjectActive || !canCreateCredentials || !isS3ConnectionEnabled

  const FormSchema = z.object({
    description: z.string().min(3, {
      message: 'Description must be at least 3 characters long',
    }),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: '',
    },
  })

  const {
    data: createS3KeyData,
    mutate: createS3AccessKey,
    isPending: isCreating,
  } = useS3AccessKeyCreateMutation({
    onSuccess: () => {
      setShowSuccess(true)
      form.reset()
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    createS3AccessKey({ projectRef, ...data })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setShowSuccess(false)
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="default"
              icon={<Plus size={14} />}
              disabled={disableCreation}
              className="pointer-events-auto"
            >
              New access key
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        {disableCreation && (
          <TooltipContent side="bottom">
            {!isProjectActive
              ? 'Restore your project to create new access keys'
              : !isS3ConnectionEnabled
                ? 'Connection via S3 protocol is currently disabled'
                : !canCreateCredentials
                  ? 'You need additional permissions to create new access keys'
                  : ''}
          </TooltipContent>
        )}
      </Tooltip>

      <DialogContent
        onInteractOutside={(e) => {
          if (showSuccess) e.preventDefault()
        }}
      >
        {showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Save your new S3 access keys</DialogTitle>
              <DialogDescription>
                You won't be able to see them again. If you lose these access keys, you'll need to
                create a new ones.
              </DialogDescription>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-4">
              <FormItemLayout label="Access key ID" isReactForm={false}>
                <Input
                  className="input-mono"
                  readOnly
                  copy
                  disabled
                  value={createS3KeyData?.access_key}
                />
              </FormItemLayout>
              <FormItemLayout label={'Secret access key'} isReactForm={false}>
                <Input
                  className="input-mono"
                  readOnly
                  copy
                  disabled
                  value={createS3KeyData?.secret_key}
                />
              </FormItemLayout>
            </DialogSection>
            <DialogFooter>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  setShowSuccess(false)
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create new S3 access keys</DialogTitle>
              <DialogDescription>
                S3 access keys provide full access to all S3 operations across all buckets and
                bypass any existing RLS policies.
              </DialogDescription>
            </DialogHeader>
            <DialogSectionSeparator />
            <Form_Shadcn_ {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogSection>
                  <FormField
                    name="description"
                    render={() => (
                      <FormItemLayout label="Description">
                        <Input
                          autoComplete="off"
                          placeholder="My test key"
                          type="text"
                          {...form.register('description')}
                        />
                      </FormItemLayout>
                    )}
                  />
                </DialogSection>
                <DialogFooter>
                  <Button htmlType="submit" loading={isCreating}>
                    Create access key
                  </Button>
                </DialogFooter>
              </form>
            </Form_Shadcn_>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
