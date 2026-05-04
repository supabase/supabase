import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, Form } from 'ui'
import * as z from 'zod'

import { DashboardToggle } from './DashboardToggle'
import {
  useIsInlineEditorSetting,
  useIsQueueOperationsSetting,
  useIsShortcutChordHudSetting,
} from './useDashboardSettings'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const DashboardSettingsSchema = z.object({
  inlineEditorEnabled: z.boolean(),
  queueOperationsEnabled: z.boolean(),
  shortcutChordHudEnabled: z.boolean(),
})

export const DashboardSettingsToggles = () => {
  const { inlineEditorEnabled, setInlineEditorEnabled } = useIsInlineEditorSetting()
  const { isQueueOperationsEnabled, setIsQueueOperationsEnabled } = useIsQueueOperationsSetting()
  const { isShortcutChordHudEnabled, setIsShortcutChordHudEnabled } = useIsShortcutChordHudSetting()

  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()

  const form = useForm<z.infer<typeof DashboardSettingsSchema>>({
    resolver: zodResolver(DashboardSettingsSchema),
    values: {
      inlineEditorEnabled: inlineEditorEnabled ?? false,
      queueOperationsEnabled: isQueueOperationsEnabled ?? false,
      shortcutChordHudEnabled: isShortcutChordHudEnabled ?? false,
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

  const handleShortcutChordHudToggle = (value: boolean) => {
    setIsShortcutChordHudEnabled(value)
    form.setValue('shortcutChordHudEnabled', value)

    sendEvent({
      action: 'shortcut_chord_hud_setting_clicked',
      properties: { enabled: value },
      groups: { organization: org?.slug },
    })

    toast(
      `${value ? 'Keyboard shortcut hints will now appear while typing chords' : 'Keyboard shortcut hints are now hidden'}`
    )
  }

  return (
    <Form {...form}>
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
          onToggle={handleQueueOperationsToggle}
        />
        <DashboardToggle
          form={form}
          name="shortcutChordHudEnabled"
          label="Show keyboard shortcut hints"
          description="Show an on-screen hint while typing multi-key keyboard shortcuts."
          onToggle={handleShortcutChordHudToggle}
          isLast
        />
      </Card>
    </Form>
  )
}
