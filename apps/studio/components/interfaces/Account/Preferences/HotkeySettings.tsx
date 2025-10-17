import { LOCAL_STORAGE_KEYS } from 'common'
import Panel from 'components/ui/Panel'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { KeyboardShortcut, Toggle } from 'ui'

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
    <Panel
      title={
        <div>
          <h5 id="keyboard-shortcuts">Keyboard shortcuts</h5>
          <p className="text-sm text-foreground-lighter">
            Choose which shortcuts stay active while working in the dashboard
          </p>
        </div>
      }
    >
      <Panel.Content className="space-y-3">
        <Toggle
          checked={commandMenuEnabled}
          onChange={() => setCommandMenuEnabled(!commandMenuEnabled)}
          label={
            <div className="flex items-center gap-x-2">
              <KeyboardShortcut keys={['Meta', 'k']} />
              <span>Command menu</span>
            </div>
          }
          descriptionText="Toggles the global command menu."
        />
        <Toggle
          checked={aiAssistantEnabled}
          onChange={() => setAiAssistantEnabled(!aiAssistantEnabled)}
          label={
            <div className="flex items-center gap-x-2">
              <KeyboardShortcut keys={['Meta', 'i']} />
              <span>AI Assistant</span>
            </div>
          }
          descriptionText="Toggles the AI Assistant panel."
        />
        <Toggle
          checked={inlineEditorEnabled}
          onChange={() => setInlineEditorEnabled(!inlineEditorEnabled)}
          label={
            <div className="flex items-center gap-x-2">
              <KeyboardShortcut keys={['Meta', 'e']} />
              <span>Inline SQL Editor</span>
            </div>
          }
          descriptionText="Toggles the inline SQL editor in a side panel"
        />
      </Panel.Content>
    </Panel>
  )
}
