import { describe, expect, it } from 'vitest'

import { hotkeyToKeys } from './formatShortcut'

describe('hotkeyToKeys', () => {
  it.each([
    // Single keys (letters, named, punctuation) are preserved
    ['K', ['K']],
    ['Enter', ['Enter']],
    ['ArrowUp', ['ArrowUp']],
    [',', [',']],
    ['/', ['/']],
    // Mod maps to Meta, alone or in combos, without reordering modifiers
    ['Mod', ['Meta']],
    ['Mod+K', ['Meta', 'K']],
    ['Mod+Shift+M', ['Meta', 'Shift', 'M']],
    ['Shift+Mod+K', ['Shift', 'Meta', 'K']],
    ['Alt+Mod+K', ['Alt', 'Meta', 'K']],
    ['Mod+Alt+Shift+K', ['Meta', 'Alt', 'Shift', 'K']],
    ['Mod+ArrowDown', ['Meta', 'ArrowDown']],
    ['Mod+Enter', ['Meta', 'Enter']],
    ['Mod+.', ['Meta', '.']],
    // Other modifier literals are untouched
    ['Ctrl+K', ['Ctrl', 'K']],
    ['Alt+K', ['Alt', 'K']],
    ['Shift+K', ['Shift', 'K']],
    ['Meta+K', ['Meta', 'K']],
    // Only exact, case-sensitive "Mod" segments are converted
    ['mod+K', ['mod', 'K']],
    ['MOD+K', ['MOD', 'K']],
    ['Model', ['Model']],
    ['Mod+Model', ['Meta', 'Model']],
    // Edge cases keep empty segments
    ['', ['']],
    ['Mod+', ['Meta', '']],
  ])('maps %j to %j', (hotkey, expected) => {
    expect(hotkeyToKeys(hotkey)).toEqual(expected)
  })
})
