import { describe, it } from 'vitest'

import {
  CONFIG_FIELD_REGISTRY,
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

  // marked as fails because it depends on @supabase/config being fixed. Once it's fixed, this test should pass and
  // be kept for future regressions of the package.
  it.fails('has no definitions for fields the default project config cannot report', () => {
    const validPaths = new Set(
      CONFIG_SECTIONS.flatMap((section) => {
        const sectionConfig = DEFAULT_PROJECT_CONFIG[section]
        if (!sectionConfig) return []

        return getSectionFieldEntries(section, sectionConfig).map(({ configPath }) => configPath)
      })
    )

    const extraPaths = Object.keys(CONFIG_FIELD_REGISTRY).filter(
      (configPath) => !validPaths.has(configPath)
    )

    if (extraPaths.length > 0) {
      throw new Error(
        `CONFIG_FIELD_REGISTRY has definitions for fields the default project config never reports:\n${extraPaths.join('\n')}`
      )
    }
  })
})
