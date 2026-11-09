import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  Form,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { DashboardToggle } from './DashboardToggle'
import { useIsInlineEditorSetting, useIsQueueOperationsSetting } from './useDashboardSettings'
import { explorerHomeSchema, useExplorerPreferences } from './useExplorerPreferences'
import { useIsExplorerEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useTrack } from '@/lib/telemetry/track'

const DashboardSettingsSchema = z.object({
  inlineEditorEnabled: z.boolean(),
  queueOperationsEnabled: z.boolean(),
})

export const DashboardSettingsToggles = () => {
  const isExplorerEnabled = useIsExplorerEnabled()
  const { home, setHome, isReady } = useExplorerPreferences()
  const { inlineEditorEnabled, setInlineEditorEnabled } = useIsInlineEditorSetting()
  const { isQueueOperationsEnabled, setIsQueueOperationsEnabled } = useIsQueueOperationsSetting()

  const track = useTrack()

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

    track('inline_editor_setting_clicked', { enabled: value })

    toast(
      `${value ? 'Editing entities will now be via the SQL Editor' : 'Editing entities will now be via a guided UI panel'}`
    )
  }

  const handleQueueOperationsToggle = (value: boolean) => {
    setIsQueueOperationsEnabled(value)
    form.setValue('queueOperationsEnabled', value)

    track('queue_operations_setting_clicked', { enabled: value })

    toast(
      `${value ? 'Table edits in the Table Editor will now be queued' : 'Table edits in the Table Editor will now be saved immediately'}`
    )
  }

  return (
    <Form {...form}>
      <Card>
        {isExplorerEnabled && (
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              label="Explorer startup"
              description="Choose how Explorer opens."
              layout="flex-row-reverse"
            >
              <Select
                value={home}
                onValueChange={(value) => {
                  const result = explorerHomeSchema.safeParse(value)
                  if (result.success) setHome(result.data)
                }}
                disabled={!isReady}
              >
                <SelectTrigger aria-label="Explorer startup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Start page</SelectItem>
                  <SelectItem value="query">SQL query</SelectItem>
                </SelectContent>
              </Select>
            </FormItemLayout>
          </CardContent>
        )}
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
          isLast
        />
      </Card>
    </Form>
  )
}
