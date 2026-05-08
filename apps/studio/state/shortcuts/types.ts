import { HotkeySequence } from '@tanstack/react-hotkeys'

export type DisabledShortcuts = Record<string, boolean>

/**
 * Runtime options for a shortcut. Used in two places:
 *
 *  1. On a `ShortcutDefinition` in the registry — acts as the default options
 *     whenever the shortcut is mounted via `useShortcut`.
 *  2. As the third argument to `useShortcut(id, callback, options)` — lets the
 *     call site override the registry defaults for a specific mount.
 *
 * Caller options take priority over registry defaults, which take priority over
 * the hard-coded fallbacks listed on each field below.
 */
export interface ShortcutOptions {
  /**
   * Whether the shortcut is live. Defaults to `true`.
   *
   * Conjunctive with the user's global enable/disable preference: if the user
   * has disabled a shortcut in Account → Preferences, passing `enabled: true`
   * here will NOT re-enable it. Use this to gate the shortcut on local
   * conditions (e.g. `enabled: hasUnsavedChanges`).
   */
  enabled?: boolean

  /**
   * Maximum time in milliseconds between consecutive keys in a multi-step
   * sequence. Defaults to `undefined`, which falls through to TanStack's
   * library default (1000ms).
   *
   * Only meaningful for multi-step sequences like `['G', 'G']`. Single-step
   * shortcuts ignore this.
   */
  timeout?: number

  /**
   * When `true`, suppresses the shortcut while focus is inside an input-like
   * element (text input, textarea, select, contenteditable). Button-type
   * inputs (type=button/submit/reset) are not ignored.
   *
   * Defaults to `undefined`, which falls through to TanStack's per-hotkey
   * default: `true` for single keys and Shift/Alt combos, `false` for
   * Ctrl/Meta/Mod shortcuts and Escape. Set explicitly to override.
   */
  ignoreInputs?: boolean

  /**
   * When `true`, the shortcut also appears as an entry in the Cmd+P command
   * menu (under the "Shortcuts" section) for as long as the hook is mounted.
   * The entry's label comes from `ShortcutDefinition.label` and the keybind
   * is rendered from `ShortcutDefinition.sequence`.
   *
   * Defaults to `false` — opt-in per call site so Cmd+P doesn't fill up with
   * context-specific shortcuts that only make sense in certain views.
   */
  registerInCommandMenu?: boolean

  /**
   * Override the registry's default `label` for the duration of this mount.
   * Flows to the Cmd+K command-menu entry and the hover tooltip rendered via
   * `<Shortcut>`. Use for shared shortcuts whose contextual label changes per
   * page (e.g. `list-page.focus-search` rendering as "Search tables" on one
   * page and "Search functions" on another). Leave `undefined` to use the
   * registry default.
   */
  label?: string
}

/**
 * A single entry in the shortcut registry. Every shortcut the app uses must
 * have a matching definition in `SHORTCUT_DEFINITIONS`.
 *
 * The registry is the single source of truth for:
 *  - the keybind (`sequence`) — used by the hotkey listener AND the Cmd+P badge
 *  - the human-readable `label` — shown in Cmd+P and in the preferences UI
 *  - per-shortcut default `options` — overridable per call site
 */
export interface ShortcutDefinition {
  /** Stable unique identifier. Must match the key used in `SHORTCUT_IDS`. */
  id: string

  /** Human-readable label shown in the command menu and preferences UI. */
  label: string

  /**
   * Keybind as a TanStack Hotkeys sequence — an array of one or more hotkey
   * strings. Single-step: `['Mod+Shift+M']`. Multi-step (chord): `['G', 'G']`.
   *
   * Use `Mod` for the platform modifier (⌘ on macOS, Ctrl elsewhere). Supports
   * `Shift`, `Alt`, `Ctrl` (literal), named keys (`Enter`, `Escape`, arrows),
   * and single character keys.
   */
  sequence: HotkeySequence

  /**
   * Default runtime options applied when the shortcut is mounted. Each field
   * is overridable by the caller of `useShortcut`.
   */
  options?: ShortcutOptions

  /**
   * Whether this shortcut appears as a toggleable entry in Account →
   * Preferences → Keyboard shortcuts. Defaults to `true`.
   *
   * Set to `false` for shortcuts that users shouldn't be able to disable (e.g.
   * the command menu opener) or for shortcuts that aren't meaningful as a
   * standalone user preference.
   */
  showInSettings?: boolean

  /**
   * Optional grouping override for the Keyboard shortcuts reference sheet.
   * Falls back to the shortcut id prefix when omitted.
   */
  referenceGroup?: string
}

export type RegistryDefinations<T extends string> = Record<T, ShortcutDefinition>
