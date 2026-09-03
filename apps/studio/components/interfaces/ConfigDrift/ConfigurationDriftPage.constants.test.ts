import { describe, it } from 'vitest'

import {
  CONFIG_SECTIONS,
  DEFAULT_PROJECT_CONFIG,
  getFieldDefinition,
  getSectionFieldEntries,
} from './ConfigurationDriftPage.constants'

describe('getFieldDefinition', () => {
  it('has a definition for every field the default project config can report', () => {
    const missingPaths = CONFIG_SECTIONS.flatMap((section) => {
      const sectionConfig = DEFAULT_PROJECT_CONFIG[section]
      if (!sectionConfig) return []

      return getSectionFieldEntries(section, sectionConfig)
        .map(({ configPath }) => configPath)
        .filter((configPath) => !getFieldDefinition(configPath))
    })

    if (missingPaths.length > 0) {
      throw new Error(
        `CONFIG_FIELD_REGISTRY is missing a definition for:\n${missingPaths.join('\n')}`
      )
    }
  })
})
