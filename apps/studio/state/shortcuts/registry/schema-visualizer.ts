import { RegistryDefinations } from '../types'

export const SCHEMA_VISUALIZER_SHORTCUT_IDS = {
  SCHEMA_VISUALIZER_COPY_SQL: 'schema-visualizer.copy-sql',
  SCHEMA_VISUALIZER_COPY_MARKDOWN: 'schema-visualizer.copy-markdown',
  SCHEMA_VISUALIZER_DOWNLOAD_PNG: 'schema-visualizer.download-png',
  SCHEMA_VISUALIZER_DOWNLOAD_SVG: 'schema-visualizer.download-svg',
  SCHEMA_VISUALIZER_AUTO_LAYOUT: 'schema-visualizer.auto-layout',
  SCHEMA_VISUALIZER_FOCUS_SCHEMA: 'schema-visualizer.focus-schema',
}

export type SchemaVisualizerShortcutId =
  (typeof SCHEMA_VISUALIZER_SHORTCUT_IDS)[keyof typeof SCHEMA_VISUALIZER_SHORTCUT_IDS]

export const schemaVisualizerRegistry: RegistryDefinations<SchemaVisualizerShortcutId> = {
  [SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_COPY_SQL]: {
    id: SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_COPY_SQL,
    label: 'Copy schema as SQL',
    sequence: ['Mod+Shift+C'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_COPY_MARKDOWN]: {
    id: SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_COPY_MARKDOWN,
    label: 'Copy schema as Markdown',
    sequence: ['Mod+Shift+M'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_DOWNLOAD_PNG]: {
    id: SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_DOWNLOAD_PNG,
    label: 'Download schema as PNG',
    sequence: ['D', 'P'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_DOWNLOAD_SVG]: {
    id: SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_DOWNLOAD_SVG,
    label: 'Download schema as SVG',
    sequence: ['D', 'S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_AUTO_LAYOUT]: {
    id: SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_AUTO_LAYOUT,
    label: 'Open auto-layout dialog',
    sequence: ['O', 'A'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_FOCUS_SCHEMA]: {
    id: SCHEMA_VISUALIZER_SHORTCUT_IDS.SCHEMA_VISUALIZER_FOCUS_SCHEMA,
    label: 'Open schema selector',
    sequence: ['O', 'S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
