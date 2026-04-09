import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'

import { usePgPartmanStatus } from '../usePgPartmanStatus'
import { CreateQueueForm, FormSchema } from './CreateQueueSheet.schema'
import { PartitionConfigFields } from './PartitionConfigFields'
import { PgPartmanCallout } from './PgPartmanCallout'
import { QueueNameField } from './QueueNameField'
import { QueueTypeSelector } from './QueueTypeSelector'
import { RlsSection } from './RlsSection'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useDatabaseQueueCreateMutation } from '@/data/database-queues/database-queues-create-mutation'
import { useQueuesExposePostgrestStatusQuery } from '@/data/database-queues/database-queues-expose-postgrest-status-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

export interface CreateQueueSheetProps {
  visible: boolean
  onClose: () => void
}

const FORM_ID = 'create-queue-sidepanel'

export const CreateQueueSheet = ({ visible, onClose }: CreateQueueSheetProps) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()

  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: createQueue, isPending } = useDatabaseQueueCreateMutation()
  const { isInstalled: pgPartmanInstalled } = usePgPartmanStatus()

  const defaultValues: CreateQueueForm = useMemo(
    () =>
      pgPartmanInstalled
        ? {
            name: '',
            enableRls: true,
            values: { type: 'partitioned', partitionInterval: 10000, retentionInterval: 100000 },
          }
        : { name: '', enableRls: true, values: { type: 'basic' } },
    [pgPartmanInstalled]
  )

  const form = useForm<CreateQueueForm>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (visible) {
      form.reset(defaultValues)
    }
  }, [form, defaultValues, visible])

  const checkIsDirty = () => form.formState.isDirty

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty,
    onClose,
  })

  const onSubmit: SubmitHandler<CreateQueueForm> = async ({ name, enableRls, values }) => {
    if (!project?.ref) {
      toast.error('Project not found')
      return
    }

    createQueue(
      {
        projectRef: project.ref,
        connectionString: project?.connectionString,
        name,
        enableRls,
        type: values.type,
        configuration:
          values.type === 'partitioned'
            ? {
                partitionInterval: values.partitionInterval,
                retentionInterval: values.retentionInterval,
              }
            : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully created queue ${name}`)
          router.push(`/project/${project?.ref}/integrations/queues/queues/${name}`)
          onClose()
        },
      }
    )
  }

  return (
    <Sheet open={visible} onOpenChange={handleOpenChange}>
      <SheetContent size="default" className="w-[35%]" tabIndex={undefined}>
        <div className="flex flex-col h-full" tabIndex={-1}>
          <SheetHeader>
            <SheetTitle>Create a new queue</SheetTitle>
          </SheetHeader>

          <div className="overflow-auto flex-grow">
            <Form_Shadcn_ {...form}>
              <form
                id={FORM_ID}
                className="flex-grow overflow-auto"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <QueueNameField form={form} />
                <Separator />
                <PgPartmanCallout />
                <QueueTypeSelector form={form} />
                <Separator />
                <PartitionConfigFields form={form} />
                <RlsSection form={form} isExposed={isExposed} projectRef={project?.ref} />
              </form>
            </Form_Shadcn_>
          </div>
          <SheetFooter>
            <Button
              size="tiny"
              type="default"
              htmlType="button"
              onClick={confirmOnClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="tiny"
              type="primary"
              form={FORM_ID}
              htmlType="submit"
              loading={isPending}
              disabled={!project?.ref}
            >
              Create queue
            </Button>
          </SheetFooter>
        </div>
        <DiscardChangesConfirmationDialog {...modalProps} />
      </SheetContent>
    </Sheet>
  )
}
