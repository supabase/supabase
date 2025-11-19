import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { LOCAL_STORAGE_KEYS } from 'common'
import Panel from 'components/ui/Panel'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { FormControl_Shadcn_, FormField_Shadcn_, Form_Shadcn_, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const InlineEditorSchema = z.object({
  inlineEditorEnabled: z.boolean(),
})

export const useIsInlineEditorEnabled = () => {
  const [inlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    false
  )

  return inlineEditorEnabled ?? false
}

export const InlineEditorSettings = () => {
  const [inlineEditorEnabled, setInlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    false
  )
  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()

  const form = useForm<z.infer<typeof InlineEditorSchema>>({
    resolver: zodResolver(InlineEditorSchema),
    values: {
      inlineEditorEnabled: inlineEditorEnabled ?? false,
    },
  })

  const handleToggle = (value: boolean) => {
    setInlineEditorEnabled(value)
    form.setValue('inlineEditorEnabled', value)

    sendEvent({
      action: 'inline_editor_setting_clicked',
      properties: {
        enabled: value,
      },
      groups: {
        organization: org?.slug,
      },
    })
  }

  return (
    <Panel title={<h5 id="inline-editor">Dashboard</h5>}>
      <Panel.Content>
        <Form_Shadcn_ {...form}>
          <FormField_Shadcn_
            control={form.control}
            name="inlineEditorEnabled"
            render={({ field }) => (
              <FormItemLayout
                layout="flex-row-reverse"
                label="Edit entities in SQL"
                description="When enabled, view and edit policies, triggers, and functions directly in the SQL editor instead of a more beginner-friendly UI panel. Ideal for those comfortable with SQL."
              >
                <FormControl_Shadcn_>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value)
                      handleToggle(value)
                    }}
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
        </Form_Shadcn_>
      </Panel.Content>
    </Panel>
  )
}
