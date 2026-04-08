import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, Form_Shadcn_ } from 'ui'
import * as z from 'zod'

import { DashboardToggle } from './DashboardToggle'
import { useIsInlineEditorSetting, useIsQueueOperationsSetting } from './useDashboardSettings'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const DashboardSettingsSchema = z.object({
  inlineEditorEnabled: z.boolean(),
  queueOperationsEnabled: z.boolean(),
})

export const DashboardSettingsToggles = () => {
  const { inlineEditorEnabled, setInlineEditorEnabled } = useIsInlineEditorSetting()
  const { isQueueOperationsEnabled, setIsQueueOperationsEnabled } = useIsQueueOperationsSetting()

  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()

  const form = useForm<z.infer<typeof DashboardSettingsSchema>>({
    resolver: zodResolver(DashboardSettingsSchema),
    values: {
      inlineEditorEnabled: inlineEditorEnabled ?? false,
      queueOperationsEnabled: isQueueOperationsEnabled ?? false,
    },
  })

  const handleInlineEditorToggle = (value: boolean) => {
    setInlineEditorEnabled(value)
    form.setValue('inlineEditorEnabled', value)

    sendEvent({
      action: 'inline_editor_setting_clicked',
      properties: { enabled: value },
      groups: { organization: org?.slug },
    })

    toast(
      `${value ? 'Editing entities will now be via the SQL Editor' : 'Editing entities will now be via a guided UI panel'}`
    )
  }

  const handleQueueOperationsToggle = (value: boolean) => {
    setIsQueueOperationsEnabled(value)
    form.setValue('queueOperationsEnabled', value)

    sendEvent({
      action: 'queue_operations_setting_clicked',
      properties: { enabled: value },
      groups: { organization: org?.slug },
    })

    toast(
      `${value ? 'Table edits in the Table Editor will now be queued' : 'Table edits in the Table Editor will now be saved immediately'}`
    )
  }

  return (
    <Form_Shadcn_ {...form}>
      <Card>
        <DashboardToggle
          form={form}
          name="inlineEditorEnabled"
          label="Edit entities in SQL"
          description="Edit policies, triggers, and functions in the SQL editor instead of the guided UI."
          onToggle={handleInlineEditorToggle}
        />
        <DashboardToggle
          form={form}
          name="queueOperationsEnabled"
          label="Queue table operations"
          description="Review and batch table edits in Table Editor before saving them to your database."
          discussionsUrl="https://github.com/orgs/supabase/discussions/42460"
          onToggle={handleQueueOperationsToggle}
          isLast
        />
      </Card>
    </Form_Shadcn_>
  )
}
