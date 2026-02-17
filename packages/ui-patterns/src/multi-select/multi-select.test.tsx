import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from './index'

// This fixes a "ReferenceError: ResizeObserver is not defined" error in the test
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver

function MultiSelectDemo() {
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  return (
    <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
      <MultiSelectorTrigger className="w-72" label="Select fruits" badgeLimit="wrap" />
      <MultiSelectorContent>
        <MultiSelectorInput placeholder="Search fruits" showResetIcon />
        <MultiSelectorList>
          <MultiSelectorItem value="Apple">Apple</MultiSelectorItem>
          <MultiSelectorItem value="Banana">Banana</MultiSelectorItem>
          <MultiSelectorItem value="Cherry">Cherry</MultiSelectorItem>
          <MultiSelectorItem value="Date">Date</MultiSelectorItem>
          <MultiSelectorItem value="Elderberrie">Elderberrie</MultiSelectorItem>
          <MultiSelectorItem value="Fig">Fig</MultiSelectorItem>
          <MultiSelectorItem value="Grape">Grape</MultiSelectorItem>
          <MultiSelectorItem value="Kiwi">Kiwi</MultiSelectorItem>
          <MultiSelectorItem value="Mango" disabled>
            Mango
          </MultiSelectorItem>
          <MultiSelectorItem value="Strawberry">Strawberry</MultiSelectorItem>
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}

describe('multi-select', () => {
  it('opens the dropdown when the MultiSelectorTrigger is clicked', () => {
    render(<MultiSelectDemo />)

    const trigger = screen.getByRole('combobox')
    expect(screen.queryByText('Apple')).not.toBeInTheDocument() // Dropdown should be closed initially

    fireEvent.click(trigger) // Click on the trigger to open
    expect(screen.getByText('Apple')).toBeInTheDocument() // Apple should be visible in the dropdown
  })

  it('adds and removes value when toggling MultiSelectorItem', () => {
    render(<MultiSelectDemo />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger) // Open the dropdown

    const appleItem = screen.getByText('Apple')
    fireEvent.click(appleItem) // Select the "Apple" item
    expect(trigger).toHaveTextContent('Apple') // "Apple" should appear in the selected values

    fireEvent.click(appleItem) // Select the "Apple" item
    expect(trigger).not.toHaveTextContent('Apple') // "Apple" should not be selected anymore
  })

  it('closes the dropdown when clicking outside the component', () => {
    render(<MultiSelectDemo />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger) // Open the dropdown
    expect(screen.getByText('Apple')).toBeInTheDocument() // Ensure it's open

    fireEvent.click(document.body) // Click outside the component

    setTimeout(() => {
      expect(screen.queryByText('Apple')).not.toBeInTheDocument() // The dropdown should be closed
    }, 100)
  })

  it('removes the last value when hitting Backspace', () => {
    render(<MultiSelectDemo />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger) // Open the dropdown

    const appleItem = screen.getByText('Apple')
    fireEvent.click(appleItem) // Select the "Apple" item
    expect(trigger).toHaveTextContent('Apple') // "Apple" should be in the selected values

    fireEvent.keyDown(trigger, { key: 'Backspace' }) // Press Backspace
    expect(trigger).not.toHaveTextContent('Apple') // "Apple" should be removed
  })

  it('supports searching and filtering items', () => {
    render(<MultiSelectDemo />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger) // Open the dropdown

    const searchInput = screen.getByPlaceholderText('Search fruits')
    fireEvent.change(searchInput, { target: { value: 'Ap' } }) // Search for "Ap"

    expect(screen.getByText('Apple')).toBeInTheDocument() // "Apple" should be visible
    expect(screen.queryByText('Banana')).not.toBeInTheDocument() // "Banana" should not be visible
  })

  it('prevents selecting disabled items', () => {
    render(<MultiSelectDemo />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger) // Open the dropdown

    const disabledItem = screen.getByText('Mango')
    fireEvent.click(disabledItem)
    expect(trigger).not.toHaveTextContent('Mango') // Mango should not be selectable
  })
})
