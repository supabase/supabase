import { ChevronsUpDown } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { isChevronsUpDownIcon, shouldUseComboboxTrigger } from './select-trigger'

describe('select-trigger helpers', () => {
  it('detects ChevronsUpDown icons', () => {
    expect(isChevronsUpDownIcon(<ChevronsUpDown />)).toBe(true)
    expect(isChevronsUpDownIcon(<ChevronsUpDown className="opacity-50" />)).toBe(true)
    expect(isChevronsUpDownIcon(null)).toBe(false)
  })

  it('delegates when role is combobox', () => {
    expect(
      shouldUseComboboxTrigger({
        role: 'combobox',
        variant: 'default',
      })
    ).toBe(true)
  })

  it('does not delegate danger combobox buttons', () => {
    expect(
      shouldUseComboboxTrigger({
        role: 'combobox',
        variant: 'danger',
      })
    ).toBe(false)
  })

  it('delegates default buttons with ChevronsUpDown', () => {
    expect(
      shouldUseComboboxTrigger({
        variant: 'default',
        iconRight: <ChevronsUpDown />,
      })
    ).toBe(true)
  })

  it('does not delegate text buttons with ChevronsUpDown', () => {
    expect(
      shouldUseComboboxTrigger({
        variant: 'text',
        iconRight: <ChevronsUpDown />,
      })
    ).toBe(false)
  })

  it('does not delegate asChild buttons', () => {
    expect(
      shouldUseComboboxTrigger({
        asChild: true,
        role: 'combobox',
      })
    ).toBe(false)
  })
})
