import { zodResolver } from '@hookform/resolvers/zod'
import { LOCAL_STORAGE_KEYS } from 'common'
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

import { HotkeyToggle } from './HotkeyToggle'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const HotkeySchema = z.object({
  commandMenuEnabled: z.boolean(),
  aiAssistantEnabled: z.boolean(),
  inlineEditorEnabled: z.boolean(),
  copyMarkdownEnabled: z.boolean(),
  copyJsonEnabled: z.boolean(),
  downloadCsvEnabled: z.boolean(),
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
  const [copyMarkdownEnabled, setCopyMarkdownEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_COPY_MARKDOWN,
    true
  )
  const [copyJsonEnabled, setCopyJsonEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_COPY_JSON,
    true
  )
  const [downloadCsvEnabled, setDownloadCsvEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_DOWNLOAD_CSV,
    true
  )

  const form = useForm<z.infer<typeof HotkeySchema>>({
    resolver: zodResolver(HotkeySchema),
    values: {
      commandMenuEnabled: commandMenuEnabled ?? true,
      aiAssistantEnabled: aiAssistantEnabled ?? true,
      inlineEditorEnabled: inlineEditorEnabled ?? true,
      copyMarkdownEnabled: copyMarkdownEnabled ?? true,
      copyJsonEnabled: copyJsonEnabled ?? true,
      downloadCsvEnabled: downloadCsvEnabled ?? true,
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
            <HotkeyToggle
              form={form}
              name="commandMenuEnabled"
              keys={['Meta', 'k']}
              label="Command menu"
              onToggle={setCommandMenuEnabled}
            />
            <HotkeyToggle
              form={form}
              name="aiAssistantEnabled"
              keys={['Meta', 'i']}
              label="AI Assistant panel"
              onToggle={setAiAssistantEnabled}
            />
            <HotkeyToggle
              form={form}
              name="inlineEditorEnabled"
              keys={['Meta', 'e']}
              label="Inline SQL Editor panel"
              onToggle={setInlineEditorEnabled}
            />
            <HotkeyToggle
              form={form}
              name="copyMarkdownEnabled"
              keys={['Shift', 'Meta', 'm']}
              label="Copy results as Markdown"
              onToggle={setCopyMarkdownEnabled}
            />
            <HotkeyToggle
              form={form}
              name="copyJsonEnabled"
              keys={['Shift', 'Meta', 'j']}
              label="Copy results as JSON"
              onToggle={setCopyJsonEnabled}
            />
            <HotkeyToggle
              form={form}
              name="downloadCsvEnabled"
              keys={['Shift', 'Meta', 'd']}
              label="Download results as CSV"
              onToggle={setDownloadCsvEnabled}
              isLast
            />
          </Card>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
