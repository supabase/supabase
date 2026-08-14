import { describe, expect, it } from 'vitest'

import { hotkeyToKeys } from './formatShortcut'

describe('hotkeyToKeys', () => {
  describe('single-step hotkeys', () => {
    it('returns a single letter key unchanged', () => {
      expect(hotkeyToKeys('K')).toEqual(['K'])
    })

    it('preserves named keys', () => {
      expect(hotkeyToKeys('Enter')).toEqual(['Enter'])
      expect(hotkeyToKeys('Escape')).toEqual(['Escape'])
      expect(hotkeyToKeys('Tab')).toEqual(['Tab'])
      expect(hotkeyToKeys('ArrowUp')).toEqual(['ArrowUp'])
      expect(hotkeyToKeys('ArrowDown')).toEqual(['ArrowDown'])
      expect(hotkeyToKeys('ArrowLeft')).toEqual(['ArrowLeft'])
      expect(hotkeyToKeys('ArrowRight')).toEqual(['ArrowRight'])
    })

    it('preserves punctuation keys', () => {
      expect(hotkeyToKeys(',')).toEqual([','])
      expect(hotkeyToKeys('.')).toEqual(['.'])
      expect(hotkeyToKeys('/')).toEqual(['/'])
    })
  })

  describe('Mod mapping', () => {
    it('converts standalone Mod to Meta', () => {
      expect(hotkeyToKeys('Mod')).toEqual(['Meta'])
    })

    it('converts Mod to Meta when combined with a single key', () => {
      expect(hotkeyToKeys('Mod+K')).toEqual(['Meta', 'K'])
    })

    it('is case sensitive — only exact "Mod" is converted', () => {
      expect(hotkeyToKeys('mod+K')).toEqual(['mod', 'K'])
      expect(hotkeyToKeys('MOD+K')).toEqual(['MOD', 'K'])
    })

    it('does not rewrite keys that merely contain "Mod" as a substring', () => {
      expect(hotkeyToKeys('Model')).toEqual(['Model'])
      expect(hotkeyToKeys('Mod+Model')).toEqual(['Meta', 'Model'])
    })
  })

  describe('modifier combos', () => {
    it('handles Mod+Shift combos', () => {
      expect(hotkeyToKeys('Mod+Shift+M')).toEqual(['Meta', 'Shift', 'M'])
      expect(hotkeyToKeys('Mod+Shift+J')).toEqual(['Meta', 'Shift', 'J'])
      expect(hotkeyToKeys('Mod+Shift+C')).toEqual(['Meta', 'Shift', 'C'])
    })

    it('preserves modifier order', () => {
      expect(hotkeyToKeys('Shift+Mod+K')).toEqual(['Shift', 'Meta', 'K'])
      expect(hotkeyToKeys('Alt+Mod+K')).toEqual(['Alt', 'Meta', 'K'])
    })

    it('leaves Ctrl, Alt, Shift, Meta literals untouched', () => {
      expect(hotkeyToKeys('Ctrl+K')).toEqual(['Ctrl', 'K'])
      expect(hotkeyToKeys('Alt+K')).toEqual(['Alt', 'K'])
      expect(hotkeyToKeys('Shift+K')).toEqual(['Shift', 'K'])
      expect(hotkeyToKeys('Meta+K')).toEqual(['Meta', 'K'])
    })

    it('handles three-modifier combos', () => {
      expect(hotkeyToKeys('Mod+Alt+Shift+K')).toEqual(['Meta', 'Alt', 'Shift', 'K'])
    })
  })

  describe('named-key combos from the registry', () => {
    it('handles Mod+ArrowUp/Down/Left/Right', () => {
      expect(hotkeyToKeys('Mod+ArrowUp')).toEqual(['Meta', 'ArrowUp'])
      expect(hotkeyToKeys('Mod+ArrowDown')).toEqual(['Meta', 'ArrowDown'])
      expect(hotkeyToKeys('Mod+ArrowLeft')).toEqual(['Meta', 'ArrowLeft'])
      expect(hotkeyToKeys('Mod+ArrowRight')).toEqual(['Meta', 'ArrowRight'])
    })

    it('handles Mod+Enter and Mod+Escape', () => {
      expect(hotkeyToKeys('Mod+Enter')).toEqual(['Meta', 'Enter'])
      expect(hotkeyToKeys('Mod+Escape')).toEqual(['Meta', 'Escape'])
    })

    it('handles Mod+. (operation queue toggle / logs reset)', () => {
      expect(hotkeyToKeys('Mod+.')).toEqual(['Meta', '.'])
    })
  })

  describe('edge cases', () => {
    it('returns a single-element array for empty input', () => {
      expect(hotkeyToKeys('')).toEqual([''])
    })

    it('preserves empty segments from trailing plus', () => {
      expect(hotkeyToKeys('Mod+')).toEqual(['Meta', ''])
    })
  })
})
