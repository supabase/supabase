import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useDatabaseQueueMessageSendMutation } from 'data/database-queues/database-queue-messages-send-mutation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Input, Modal } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface SendMessageModalProps {
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  delay: z.coerce.number().int().gte(0).default(5),
  payload: z.string().refine(
    (val) => {
      try {
        JSON.parse(val)
      } catch {
        return false
      }
    },
    {
      message: 'The payload should be a JSON object',
    }
  ),
})

export type SendMessageForm = z.infer<typeof FormSchema>

const FORM_ID = 'QUEUES_SEND_MESSAGE_FORM'

export const SendMessageModal = ({ visible, onClose }: SendMessageModalProps) => {
  const { childId: queueName } = useParams()
  const { project } = useProjectContext()
  const form = useForm<SendMessageForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      delay: 1,
      payload: '{}',
    },
  })

  const { isLoading, mutate } = useDatabaseQueueMessageSendMutation({
    onSuccess: () => {
      toast.success(`Successfully added a message to the queue.`)
      onClose()
    },
  })

  const onSubmit: SubmitHandler<SendMessageForm> = (values) => {
    mutate({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      queueName: queueName!,
      payload: values.payload,
      delay: values.delay,
    })
  }

  useEffect(() => {
    if (visible) {
      form.reset({ delay: 1, payload: '{}' })
    }
  }, [visible])

  return (
    <Modal
      size="medium"
      alignFooter="right"
      header="Add a message to the queue"
      visible={visible}
      loading={isLoading}
      onCancel={onClose}
      confirmText="Add"
      onConfirm={() => {
        const values = form.getValues()
        onSubmit(values)
      }}
    >
      <Modal.Content className="flex flex-col gap-y-4">
        <Form_Shadcn_ {...form}>
          <form
            id={FORM_ID}
            className="flex-grow overflow-auto gap-2 flex flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField_Shadcn_
              control={form.control}
              name="delay"
              render={({ field: { ref, ...rest } }) => (
                <FormItemLayout
                  label="Delay"
                  layout="vertical"
                  className="gap-1"
                  description="Time in seconds before the message becomes available for reading."
                >
                  <FormControl_Shadcn_>
                    <Input
                      {...rest}
                      type="number"
                      placeholder="1"
                      actions={<p className="text-foreground-light pr-2">sec</p>}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="payload"
              render={({ field }) => (
                <FormItemLayout label="Message payload" layout="vertical" className="gap-1">
                  <FormControl_Shadcn_>
                    <CodeEditor
                      id="message-payload"
                      language="json"
                      className="!mb-0 h-32 overflow-hidden rounded border"
                      onInputChange={(e: string | undefined) => field.onChange(e)}
                      options={{ wordWrap: 'off', contextmenu: false }}
                      value={field.value}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </form>
        </Form_Shadcn_>
      </Modal.Content>
    </Modal>
  )
}
