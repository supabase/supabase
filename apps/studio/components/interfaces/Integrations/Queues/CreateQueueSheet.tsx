import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { Markdown } from 'components/interfaces/Markdown'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useDatabaseQueueCreateMutation } from 'data/database-queues/database-queues-create-mutation'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useConfirmOnClose, type ConfirmOnCloseModalProps } from 'hooks/ui/useConfirmOnClose'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { QUEUE_TYPES } from './Queues.constants'
import { QueryNameSchema } from './Queues.utils'

export interface CreateQueueSheetProps {
  visible: boolean
  onClose: () => void
}

const normalQueueSchema = z.object({
  type: z.literal('basic'),
})

const partitionedQueueSchema = z.object({
  type: z.literal('partitioned'),
  partitionInterval: z.number(),
  retentionInterval: z.number(),
})

const unloggedQueueSchema = z.object({
  type: z.literal('unlogged'),
})

const FormSchema = z.object({
  name: QueryNameSchema,
  enableRls: z.boolean(),
  values: z.discriminatedUnion('type', [
    normalQueueSchema,
    partitionedQueueSchema,
    unloggedQueueSchema,
  ]),
})

export type CreateQueueForm = z.infer<typeof FormSchema>
export type QueueType = CreateQueueForm['values']

const FORM_ID = 'create-queue-sidepanel'

export const CreateQueueSheet = ({ visible, onClose }: CreateQueueSheetProps) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()

  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: createQueue, isPending } = useDatabaseQueueCreateMutation()

  const form = useForm<CreateQueueForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      enableRls: true,
      values: { type: 'basic' },
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset()
    }
  }, [
    form,
    // end of stable references
    visible,
  ])

  const checkIsDirty = () => form.formState.isDirty

  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty,
    onClose,
  })

  const onSubmit: SubmitHandler<CreateQueueForm> = async ({ name, enableRls, values }) => {
    createQueue(
      {
        projectRef: project!.ref,
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

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgPartmanExtension = (data ?? []).find((ext) => ext.name === 'pg_partman')
  const pgPartmanExtensionInstalled = pgPartmanExtension?.installed_version != undefined

  const queueType = form.watch('values.type')

  return (
    <Sheet open={visible} onOpenChange={confirmOnClose}>
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
                <SheetSection>
                  <FormField_Shadcn_
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout label="Name" layout="vertical" className="gap-1 relative">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} />
                        </FormControl_Shadcn_>
                        <span className="text-foreground-lighter text-xs absolute top-0 right-0">
                          Must be all lowercase letters
                        </span>
                      </FormItemLayout>
                    )}
                  />
                </SheetSection>
                <Separator />
                <SheetSection>
                  <FormField_Shadcn_
                    control={form.control}
                    name="values.type"
                    render={({ field }) => (
                      <FormItemLayout label="Type" layout="vertical" className="gap-1">
                        <FormControl_Shadcn_>
                          <RadioGroupStacked
                            id="queue_type"
                            name="queue_type"
                            value={field.value}
                            disabled={field.disabled}
                            onValueChange={field.onChange}
                          >
                            {QUEUE_TYPES.map((definition) => (
                              <RadioGroupStackedItem
                                key={definition.value}
                                id={definition.value}
                                value={definition.value}
                                label=""
                                disabled={
                                  !pgPartmanExtensionInstalled && definition.value === 'partitioned'
                                }
                                showIndicator={false}
                              >
                                <div className="flex items-start gap-x-5">
                                  <div className="text-foreground">{definition.icon}</div>
                                  <div className="flex flex-col gap-y-1">
                                    <div className="flex items-center gap-x-2">
                                      <p className="text-foreground text-left">
                                        {definition.label}
                                      </p>
                                      {definition.value === 'partitioned' && (
                                        <Badge>Coming soon</Badge>
                                      )}
                                    </div>
                                    <p className="text-foreground-lighter text-left">
                                      {definition.description}
                                    </p>
                                  </div>
                                </div>
                              </RadioGroupStackedItem>
                            ))}
                          </RadioGroupStacked>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </SheetSection>
                <Separator />
                {queueType === 'partitioned' && (
                  <>
                    <SheetSection className="flex flex-col gap-3">
                      <FormField_Shadcn_
                        control={form.control}
                        name="values.partitionInterval"
                        render={({ field: { ref, ...rest } }) => (
                          <FormItemLayout label="Partition interval" className="gap-1">
                            <Input
                              {...rest}
                              type="number"
                              placeholder="1000"
                              actions={<p className="text-foreground-light pr-2">ms</p>}
                            />
                          </FormItemLayout>
                        )}
                      />
                      <FormField_Shadcn_
                        control={form.control}
                        name="values.retentionInterval"
                        render={({ field: { ref, ...rest } }) => (
                          <FormItemLayout label="Retention interval" className="gap-1">
                            <Input
                              {...rest}
                              type="number"
                              placeholder="1000"
                              actions={<p className="text-foreground-light pr-2">ms</p>}
                            />
                          </FormItemLayout>
                        )}
                      />
                    </SheetSection>
                    <Separator />
                  </>
                )}
                <SheetSection className="flex flex-col gap-y-2">
                  <FormField_Shadcn_
                    control={form.control}
                    name="enableRls"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex"
                        label={
                          <div className="flex items-center gap-x-2">
                            <p>Enable Row Level Security (RLS)</p>
                            <Badge variant="success">Recommended</Badge>
                          </div>
                        }
                        description="Restrict access to your queue by enabling RLS and writing Postgres policies to control access for each role."
                      >
                        <FormControl_Shadcn_>
                          <Checkbox_Shadcn_
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={field.disabled || isExposed}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                  {!isExposed ? (
                    <Admonition
                      type="default"
                      title="Row Level Security for queues is only relevant if exposure through PostgREST has been enabled"
                    >
                      <Markdown
                        className="[&>p]:!leading-normal"
                        content={`You may opt to manage your queues via any Supabase client libraries or PostgREST
                      endpoints by enabling this in the [queues settings](/project/${project?.ref}/integrations/queues/settings).`}
                      />
                    </Admonition>
                  ) : (
                    <Admonition
                      type="default"
                      title="RLS must be enabled as queues are exposed via PostgREST"
                      description="This is to prevent anonymous access to any of your queues"
                    />
                  )}
                </SheetSection>
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
            <Button size="tiny" type="primary" form={FORM_ID} htmlType="submit" loading={isPending}>
              Create queue
            </Button>
          </SheetFooter>
        </div>
        <CloseConfirmationModal {...closeConfirmationModalProps} />
      </SheetContent>
    </Sheet>
  )
}

const CloseConfirmationModal = ({ visible, onClose, onCancel }: ConfirmOnCloseModalProps) => (
  <ConfirmationModal
    visible={visible}
    title="Discard changes"
    confirmLabel="Discard"
    onCancel={onCancel}
    onConfirm={onClose}
  >
    <p className="text-sm text-foreground-light">
      There are unsaved changes. Are you sure you want to close the panel? Your changes will be
      lost.
    </p>
  </ConfirmationModal>
)
