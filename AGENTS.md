# Supabase Monorepo Agent Guidance

Use Australian English in PR descriptions, review comments, and generated prose.

Do not create a pull request unless the user explicitly asks for one.

## Studio Keyboard Shortcuts

When touching Studio UI, check whether the affected workflow needs keyboard shortcut coverage. This applies to new UI, changed UI, and nearby controls that become more important because of the change.

- Use the shared shortcut registry in `apps/studio/state/shortcuts/registry.ts` and `useShortcut`; do not add one-off DOM listeners for normal UI actions.
- Add shortcut discovery where the action is visible: use `ShortcutTooltip` for buttons and controls, or `ShortcutBadge` for menu items.
- Prefer mnemonic sequential chords for scoped actions. Keep `G then ...` for navigation only.
- Avoid browser, editor, and system-owned chords, especially copy/save/search/devtools-shaped `Mod` shortcuts.
- Before choosing a binding, check existing registry files and non-registry handlers such as command-menu listeners, Monaco keybindings, grid handlers, and direct `keydown` code.

For detailed Studio shortcut guidance, see `.claude/skills/studio-shortcuts/SKILL.md`.
