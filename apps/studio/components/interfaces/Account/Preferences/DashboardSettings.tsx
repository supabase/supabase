import { zodResolver } from '@hookform/resolvers/zod'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useForm } from 'react-hook-form'
import { Card, Form_Shadcn_ } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import { DashboardToggle } from './DashboardToggle'
import { useIsInlineEditorSetting, useIsQueueOperationsSetting } from './useDashboardSettings'

const DashboardSettingsSchema = z.object({
  inlineEditorEnabled: z.boolean(),
  queueOperationsEnabled: z.boolean(),
})

export const DashboardSettings = () => {
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
  }

  const handleQueueOperationsToggle = (value: boolean) => {
    setIsQueueOperationsEnabled(value)
    form.setValue('queueOperationsEnabled', value)

    sendEvent({
      action: 'queue_operations_setting_clicked',
      properties: { enabled: value },
      groups: { organization: org?.slug },
    })
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle id="dashboard">Dashboard</PageSectionTitle>
          <PageSectionDescription>
            Customize your dashboard editing experience.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <Card>
            <DashboardToggle
              form={form}
              name="inlineEditorEnabled"
              label="Edit entities in SQL"
              description="When enabled, view and edit policies, triggers, and functions directly in the SQL editor instead of a more beginner-friendly UI panel. Ideal for those comfortable with SQL."
              onToggle={handleInlineEditorToggle}
            />
            <DashboardToggle
              form={form}
              name="queueOperationsEnabled"
              label="Queue table operations"
              description="When enabled, table edits in the Table Editor are queued for review before saving to your database, allowing you to batch multiple changes and commit them together."
              discussionsUrl="https://github.com/orgs/supabase/discussions/42460"
              onToggle={handleQueueOperationsToggle}
              isLast
            />
          </Card>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
