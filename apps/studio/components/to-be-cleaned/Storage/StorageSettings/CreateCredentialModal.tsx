import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { FormField } from '@ui/components/shadcn/ui/form'
import { useParams } from 'common'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import { useS3AccessKeyCreateMutation } from 'data/storage/s3-access-key-create-mutation'
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
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface CreateCredentialModalProps {
  visible: boolean
  onOpenChange: (value: boolean) => void
}

export const CreateCredentialModal = ({ visible, onOpenChange }: CreateCredentialModalProps) => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const [showSuccess, setShowSuccess] = useState(false)

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
    isLoading: isCreating,
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
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <DialogTrigger asChild>
            <Button type="default" disabled={!isProjectActive}>
              New access key
            </Button>
          </DialogTrigger>
        </TooltipTrigger_Shadcn_>
        {!isProjectActive && (
          <TooltipContent_Shadcn_>
            Restore your project to create new access keys
          </TooltipContent_Shadcn_>
        )}
      </Tooltip_Shadcn_>

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
                    render={({ field }) => (
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
                  <Button className="mt-4" htmlType="submit" loading={isCreating}>
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
