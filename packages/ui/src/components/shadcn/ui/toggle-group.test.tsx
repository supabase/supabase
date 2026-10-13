import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const renderSegmented = (props: {
  defaultValue?: string
  onValueChange?: (value: string) => void
  allowDeselect?: boolean
  tone?: 'outline' | 'text' | 'primary'
}) => (
  <ToggleGroup variant="segmented" size="tiny" type="single" {...props}>
    <ToggleGroupItem value="data">Data</ToggleGroupItem>
    <ToggleGroupItem value="definition">Definition</ToggleGroupItem>
  </ToggleGroup>
)

describe('ToggleGroup', () => {
  it('leaves the segmented container naked — no border on the root or the items', () => {
    render(renderSegmented({ defaultValue: 'data' }))

    const root = screen.getByRole('group')

    expect(root).toHaveClass('p-px', 'gap-0', 'w-fit')
    expect(root).not.toHaveClass('border', 'border-strong')
    expect(screen.getByRole('radio', { name: 'Data' })).not.toHaveClass('border')
  })

  it('leaves the selected item unpainted so only the indicator marks it', () => {
    render(renderSegmented({ defaultValue: 'data' }))

    const selected = screen.getByRole('radio', { name: 'Data' })

    expect(selected).toHaveAttribute('aria-checked', 'true')
    expect(selected).toHaveClass('data-[state=on]:bg-transparent', 'aria-checked:bg-transparent')
    expect(selected).not.toHaveClass(
      'data-[state=on]:bg-accent',
      'aria-checked:bg-accent',
      'data-[state=on]:bg-overlay-hover',
      'data-[state=on]:border-strong',
      'data-[state=on]:shadow-sm'
    )
  })

  it('adds a container border only for the outline tone', () => {
    const { rerender } = render(renderSegmented({ defaultValue: 'data' }))
    expect(screen.getByRole('group')).not.toHaveClass('border-strong')

    rerender(renderSegmented({ defaultValue: 'data', tone: 'outline' }))
    expect(screen.getByRole('group')).toHaveClass('border', 'border-strong')
  })

  it('tones the indicator rather than the items', () => {
    const { container, rerender } = render(renderSegmented({ defaultValue: 'data' }))
    expect(container.querySelector('[data-segment-indicator]')).toHaveClass('bg-accent')

    rerender(renderSegmented({ defaultValue: 'data', tone: 'outline' }))
    expect(container.querySelector('[data-segment-indicator]')).toHaveClass(
      'bg-overlay-hover',
      'border-strong'
    )

    rerender(renderSegmented({ defaultValue: 'data', tone: 'primary' }))
    expect(container.querySelector('[data-segment-indicator]')).toHaveClass('bg-brand-400')
    expect(screen.getByRole('radio', { name: 'Data' })).toHaveClass(
      'data-[state=on]:bg-transparent'
    )
  })

  it('gives items a pointer cursor', () => {
    render(renderSegmented({ defaultValue: 'data' }))

    expect(screen.getByRole('radio', { name: 'Data' })).toHaveClass('cursor-pointer')
  })

  it('clears the selection on re-click by default', async () => {
    const onValueChange = vi.fn()
    render(renderSegmented({ defaultValue: 'data', onValueChange }))

    await userEvent.click(screen.getByRole('radio', { name: 'Data' }))

    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('keeps the active item selected across repeated clicks when allowDeselect is false', async () => {
    const onValueChange = vi.fn()
    render(renderSegmented({ defaultValue: 'data', onValueChange, allowDeselect: false }))

    const active = screen.getByRole('radio', { name: 'Data' })

    await userEvent.click(active)
    expect(active).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(active)
    expect(active).toHaveAttribute('aria-checked', 'true')
    expect(onValueChange).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('radio', { name: 'Definition' }))

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('definition')
    expect(screen.getByRole('radio', { name: 'Definition' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(active).toHaveAttribute('aria-checked', 'false')
  })

  it('leaves a controlled group to its own value', async () => {
    const onValueChange = vi.fn()
    const Controlled = () => {
      const [value, setValue] = React.useState('data')
      return (
        <ToggleGroup
          variant="segmented"
          type="single"
          allowDeselect={false}
          value={value}
          onValueChange={(next) => {
            onValueChange(next)
            setValue(next)
          }}
        >
          <ToggleGroupItem value="data">Data</ToggleGroupItem>
          <ToggleGroupItem value="definition">Definition</ToggleGroupItem>
        </ToggleGroup>
      )
    }
    render(<Controlled />)

    const active = screen.getByRole('radio', { name: 'Data' })
    await userEvent.click(active)

    expect(active).toHaveAttribute('aria-checked', 'true')
    expect(onValueChange).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('radio', { name: 'Definition' }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('definition')
  })

  it('still deselects an uncontrolled group when allowDeselect is left alone', async () => {
    render(renderSegmented({ defaultValue: 'data' }))

    const active = screen.getByRole('radio', { name: 'Data' })
    await userEvent.click(active)

    expect(active).toHaveAttribute('aria-checked', 'false')
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
    it('renders one automatically for a single-select segmented group', () => {
      const { container } = render(renderSegmented({ defaultValue: 'data' }))

      expect(container.querySelectorAll('[data-segment-indicator]')).toHaveLength(1)
    })

    it('measures the active item onto the root as custom properties', async () => {
      render(renderSegmented({ defaultValue: 'data' }))

      const root = screen.getByRole('group')

      await waitFor(() => expect(root).toHaveAttribute('data-segment-indicator-ready'))
      expect(root.style.getPropertyValue('--active-segment-left')).not.toBe('')
      expect(root.style.getPropertyValue('--active-segment-width')).not.toBe('')
    })

    it('falls back to per-item paint for multi-select, which an indicator cannot track', () => {
      const { container } = render(
        <ToggleGroup variant="segmented" size="tiny" type="multiple" defaultValue={['a']}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      )

      expect(container.querySelector('[data-segment-indicator]')).toBeNull()
      expect(screen.getByRole('button', { name: 'A' })).toHaveClass(
        'data-[state=on]:bg-overlay-hover'
      )
    })
  })
})
