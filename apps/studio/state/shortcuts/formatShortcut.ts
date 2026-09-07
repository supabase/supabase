/**
 * Convert a TanStack Hotkeys hotkey string (e.g. `"Mod+Shift+M"`) into the
 * key-array format consumed by the `<KeyboardShortcut />` component from `ui`
 * (e.g. `["Meta", "Shift", "M"]`). `KeyboardShortcut` resolves `Meta` to ⌘ on
 * macOS or `Ctrl` elsewhere, so this mapping is platform-safe.
 */
export const hotkeyToKeys = (hotkey: string): string[] =>
  hotkey.split('+').map((part) => (part === 'Mod' ? 'Meta' : part))
