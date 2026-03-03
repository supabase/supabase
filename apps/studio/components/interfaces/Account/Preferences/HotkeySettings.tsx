import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { LOCAL_STORAGE_KEYS } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import {
  Card,
  CardContent,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  KeyboardShortcut,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

const HotkeySchema = z.object({
  commandMenuEnabled: z.boolean(),
  aiAssistantEnabled: z.boolean(),
  inlineEditorEnabled: z.boolean(),
})

export const HotkeySettings = () => {
  const [inlineEditorEnabled, setInlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.EDITOR_PANEL),
    true
  )
  const [commandMenuEnabled, setCommandMenuEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_COMMAND_MENU,
    true
  )
  const [aiAssistantEnabled, setAiAssistantEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.AI_ASSISTANT),
    true
  )

  const form = useForm<z.infer<typeof HotkeySchema>>({
    resolver: zodResolver(HotkeySchema),
    values: {
      commandMenuEnabled: commandMenuEnabled ?? true,
      aiAssistantEnabled: aiAssistantEnabled ?? true,
      inlineEditorEnabled: inlineEditorEnabled ?? true,
    },
  })

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle id="keyboard-shortcuts">Keyboard shortcuts</PageSectionTitle>
          <PageSectionDescription>
            Choose which shortcuts stay active while working in the dashboard.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <Card>
            <CardContent className="border-b">
              <FormField_Shadcn_
                control={form.control}
                name="commandMenuEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'k']} />
                        <span>Command menu</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setCommandMenuEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent className="border-b">
              <FormField_Shadcn_
                control={form.control}
                name="aiAssistantEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'i']} />
                        <span>AI Assistant Panel</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setAiAssistantEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="inlineEditorEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'e']} />
                        <span>Inline SQL Editor Panel</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setInlineEditorEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
          </Card>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
