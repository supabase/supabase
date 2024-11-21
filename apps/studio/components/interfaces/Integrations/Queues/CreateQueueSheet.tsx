import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useDatabaseQueueCreateMutation } from 'data/database-queues/database-queues-create-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Badge,
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { QUEUE_TYPES } from './Queues.constants'

export interface CreateQueueSheetProps {
  isClosing: boolean
  setIsClosing: (v: boolean) => void
  onClose: () => void
}

const normalQueueSchema = z.object({
  type: z.literal('normal'),
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
  name: z
    .string()
    .trim()
    .min(1, 'Please provide a name for your queue')
    .max(47, "The name can't be longer than 47 characters"),
  values: z.discriminatedUnion('type', [
    normalQueueSchema,
    partitionedQueueSchema,
    unloggedQueueSchema,
  ]),
})

export type CreateQueueForm = z.infer<typeof FormSchema>
export type QueueType = CreateQueueForm['values']

const FORM_ID = 'create-queue-sidepanel'

export const CreateQueueSheet = ({ isClosing, setIsClosing, onClose }: CreateQueueSheetProps) => {
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)
  const { mutate: createQueue, isLoading } = useDatabaseQueueCreateMutation()

  const canToggleExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const form = useForm<CreateQueueForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      values: {
        type: 'normal',
      },
    },
  })

  const { project } = useProjectContext()
  const isEdited = form.formState.isDirty

  // if the form hasn't been touched and the user clicked esc or the backdrop, close the sheet
  if (!isEdited && isClosing) {
    onClose()
  }

  const onClosePanel = () => {
    if (isEdited) {
      setIsClosing(true)
    } else {
      onClose()
    }
  }

  const onSubmit: SubmitHandler<CreateQueueForm> = async ({ name, values }) => {
    let query = `SELECT pgmq.create('${name}');`
    if (values.type === 'partitioned') {
      query = `select from pgmq.create_partitioned('${name}', '${values.partitionInterval}', '${values.retentionInterval}');`
    }
    if (values.type === 'unlogged') {
      query = `SELECT pgmq.create_unlogged('${name}');`
    }

    createQueue(
      {
        projectRef: project!.ref,
        connectionString: project?.connectionString,
        query,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully created queue ${name}`)
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
    <>
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
                    <FormItemLayout label="Name" layout="vertical" className="gap-1">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} />
                      </FormControl_Shadcn_>
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
                              <div className="flex items-center gap-x-5">
                                <div className="text-foreground">{definition.icon}</div>
                                <div className="flex flex-col">
                                  <div className="flex gap-x-2">
                                    <p className="text-foreground">{definition.label}</p>
                                  </div>
                                  <p className="text-foreground-light text-left">
                                    {definition.description}
                                  </p>
                                </div>
                              </div>
                              {definition.value === 'partitioned' ? (
                                <div className="pt-2 pl-10">
                                  <Badge variant="warning">COMING SOON</Badge>
                                </div>
                              ) : null}
                              {/* {!pgPartmanExtensionInstalled &&
                              definition.value === 'partitioned' ? (
                                <div className="w-full flex gap-x-2 pl-11 py-2 items-center">
                                  <WarningIcon />
                                  <span className="text-xs">
                                    <code>pg_partman</code> needs to be installed to use this type
                                  </span>
                                </div>
                              ) : null} */}
                            </RadioGroupStackedItem>
                          ))}
                        </RadioGroupStacked>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                {/* {!pgPartmanExtensionInstalled && (
                  <Admonition
                    type="note"
                    // @ts-ignore
                    title={
                      <span>
                        Enable <code className="text-xs w-min">pg_partman</code> for partitioned
                        queues
                      </span>
                    }
                    description={
                      <div className="flex flex-col gap-y-2">
                        <span>
                          This will allow you to create partitioned queues which can handle a large
                          amount of messages
                        </span>
                        <ButtonTooltip
                          type="default"
                          className="w-min"
                          disabled={!canToggleExtensions}
                          onClick={() => setShowEnableExtensionModal(true)}
                          tooltip={{
                            content: {
                              side: 'bottom',
                              text: 'You need additional permissions to enable database extensions',
                            },
                          }}
                        >
                          Install pg_partman extension
                        </ButtonTooltip>
                      </div>
                    }
                  />
                )} */}
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
                </>
              )}
            </form>
          </Form_Shadcn_>
        </div>
        <SheetFooter>
          <Button
            size="tiny"
            type="default"
            htmlType="button"
            onClick={onClosePanel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="tiny"
            type="primary"
            form={FORM_ID}
            htmlType="submit"
            disabled={isLoading}
            loading={isLoading}
          >
            Create queue
          </Button>
        </SheetFooter>
      </div>
      <ConfirmationModal
        visible={isClosing}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosing(false)}
        onConfirm={() => onClose()}
      >
        <p className="text-sm text-foreground-light">
          There are unsaved changes. Are you sure you want to close the panel? Your changes will be
          lost.
        </p>
      </ConfirmationModal>
      {pgPartmanExtension && (
        <EnableExtensionModal
          visible={showEnableExtensionModal}
          extension={pgPartmanExtension}
          onCancel={() => setShowEnableExtensionModal(false)}
        />
      )}
    </>
  )
}
