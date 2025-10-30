import { LOCAL_STORAGE_KEYS } from 'common'
import Panel from 'components/ui/Panel'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { FormControl_Shadcn_, FormField_Shadcn_, Form_Shadcn_, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'

const InlineEditorSchema = z.object({
  inlineEditorEnabled: z.boolean(),
})

export const InlineEditorSettings = () => {
  const [inlineEditorEnabled, setInlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    true
  )

  const { mutate: sendEvent } = useSendEventMutation()

  const form = useForm<z.infer<typeof InlineEditorSchema>>({
    resolver: zodResolver(InlineEditorSchema),
    values: {
      inlineEditorEnabled: inlineEditorEnabled ?? true,
    },
  })

  const handleToggle = (value: boolean) => {
    setInlineEditorEnabled(value)
    form.setValue('inlineEditorEnabled', value)

    sendEvent({
      action: 'inline_editor_setting_toggled',
      properties: {
        enabled: value,
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
