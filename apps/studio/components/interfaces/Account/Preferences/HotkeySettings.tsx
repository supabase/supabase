import { LOCAL_STORAGE_KEYS } from 'common'
import Panel from 'components/ui/Panel'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { Toggle } from 'ui'

export const HotkeySettings = () => {
  const [inlineEditorEnabled, setInlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_INLINE_EDITOR,
    true
  )
  const [commandMenuEnabled, setCommandMenuEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_COMMAND_MENU,
    true
  )
  const [aiAssistantEnabled, setAiAssistantEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_AI_ASSISTANT,
    true
  )

  return (
    <Panel title={<h5 id="keyboard-shortcuts">Keyboard shortcuts</h5>}>
      <Panel.Content className="space-y-3">
        <p className="text-sm text-foreground-light">
          Choose which shortcuts stay active while working in the dashboard.
        </p>
        <Toggle
          checked={commandMenuEnabled}
          onChange={() => setCommandMenuEnabled(!commandMenuEnabled)}
          label="Command menu"
          descriptionText="Cmd/Ctrl + K toggles the global command menu."
        />
        <Toggle
          checked={aiAssistantEnabled}
          onChange={() => setAiAssistantEnabled(!aiAssistantEnabled)}
          label="AI Assistant"
          descriptionText="Cmd/Ctrl + I toggles the AI Assistant panel."
        />
        <Toggle
          checked={inlineEditorEnabled}
          onChange={() => setInlineEditorEnabled(!inlineEditorEnabled)}
          label="Side panel SQL editor"
          descriptionText="Cmd/Ctrl + E toggles the side panel SQL editor."
        />
      </Panel.Content>
    </Panel>
  )
}
