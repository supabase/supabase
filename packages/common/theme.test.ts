import { describe, expect, it } from 'vitest'

import { migrateLegacyTheme, THEME_DOM_VALUES } from './theme'

it('renders the legacy preference as Dark before migration', () => {
  expect(THEME_DOM_VALUES['classic-dark']).toBe('dark')
})

describe('migrateLegacyTheme', () => {
  it('migrates Classic Dark to Dark', () => {
    expect(migrateLegacyTheme('classic-dark')).toBe('dark')
  })

  it.each(['dark', 'light', 'system', undefined])('leaves %s unchanged', (theme) => {
    expect(migrateLegacyTheme(theme)).toBe(theme)
  })
})
