import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ToggleGroup, ToggleGroupIndicator, ToggleGroupItem } from './toggle-group'

const renderSegmented = (props: {
  defaultValue?: string
  onValueChange?: (value: string) => void
  allowDeselect?: boolean
}) => (
  <ToggleGroup variant="segmented" size="tiny" type="single" {...props}>
    <ToggleGroupItem value="data">Data</ToggleGroupItem>
    <ToggleGroupItem value="definition">Definition</ToggleGroupItem>
  </ToggleGroup>
)

describe('ToggleGroup', () => {
  it('draws the segmented container on the root rather than each item', () => {
    render(renderSegmented({ defaultValue: 'data' }))

    expect(screen.getByRole('group')).toHaveClass('border-strong', 'p-px', 'gap-0', 'w-fit')
  })

  it('keeps the selected item styled when Radix marks it via aria-checked', () => {
    render(renderSegmented({ defaultValue: 'data' }))

    const selected = screen.getByRole('radio', { name: 'Data' })

    expect(selected).toHaveAttribute('aria-checked', 'true')
    expect(selected).toHaveClass(
      'data-[state=on]:bg-overlay-hover',
      'aria-checked:bg-overlay-hover'
    )
    expect(selected).not.toHaveClass('bg-accent', 'aria-checked:bg-accent')
  })

  it('clears the selection on re-click by default', async () => {
    const onValueChange = vi.fn()
    render(renderSegmented({ defaultValue: 'data', onValueChange }))

    await userEvent.click(screen.getByRole('radio', { name: 'Data' }))

    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('swallows the empty value when allowDeselect is false', async () => {
    const onValueChange = vi.fn()
    render(renderSegmented({ defaultValue: 'data', onValueChange, allowDeselect: false }))

    await userEvent.click(screen.getByRole('radio', { name: 'Data' }))

    expect(onValueChange).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('radio', { name: 'Definition' }))

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('definition')
  })

  it('still reports every change for multi-select groups', async () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup
        variant="segmented"
        size="tiny"
        type="multiple"
        allowDeselect={false}
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>
    )

    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onValueChange).toHaveBeenCalledWith(['a'])

    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onValueChange).toHaveBeenCalledWith([])
  })

  it('moves focus between items with the arrow keys', async () => {
    render(renderSegmented({ defaultValue: 'data' }))

    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Data' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Definition' })).toHaveFocus()
  })

  describe('with a sliding indicator', () => {
    const renderWithIndicator = () =>
      render(
        <ToggleGroup variant="segmented" size="tiny" type="single" defaultValue="data">
          <ToggleGroupIndicator />
          <ToggleGroupItem value="data">Data</ToggleGroupItem>
          <ToggleGroupItem value="definition">Definition</ToggleGroupItem>
        </ToggleGroup>
      )

    it('measures the active item onto the root as custom properties', async () => {
      renderWithIndicator()

      const root = screen.getByRole('group')

      await waitFor(() => expect(root).toHaveAttribute('data-segment-indicator-ready'))
      expect(root.style.getPropertyValue('--active-segment-left')).not.toBe('')
      expect(root.style.getPropertyValue('--active-segment-width')).not.toBe('')
    })

    it('hands the selected treatment to the indicator instead of the item', () => {
      renderWithIndicator()

      expect(screen.getByRole('radio', { name: 'Data' })).toHaveClass(
        'group-has-[[data-segment-indicator]]/segmented:bg-transparent',
        'group-has-[[data-segment-indicator]]/segmented:shadow-none'
      )
    })

    it('leaves the item painting its own background when there is no indicator', async () => {
      render(renderSegmented({ defaultValue: 'data' }))

      const root = screen.getByRole('group')

      await waitFor(() => {
        expect(root).not.toHaveAttribute('data-segment-indicator-ready')
      })
      expect(root.style.getPropertyValue('--active-segment-width')).toBe('')
    })
  })
})
