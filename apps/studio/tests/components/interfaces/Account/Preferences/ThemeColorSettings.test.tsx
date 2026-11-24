import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type * as UI from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeColorSettings } from '@/components/interfaces/Account/Preferences/ThemeColorSettings'
import { customRender } from '@/tests/lib/custom-render'

type SliderProps = ComponentProps<typeof UI.Slider>

const { resetOverrides, setOverride, mockUseFlag } = vi.hoisted(() => ({
  resetOverrides: vi.fn(),
  setOverride: vi.fn(),
  mockUseFlag: vi.fn(() => true),
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useFlag: mockUseFlag,
  }
})

vi.mock('@/hooks/misc/useThemeOverrides', () => ({
  useThemeOverrides: () => ({
    mode: 'dark',
    overrides: { chroma: 0.02 },
    resetOverrides,
    setOverride,
  }),
}))

vi.mock('ui', async (importOriginal) => {
  const actual = await importOriginal<typeof UI>()

  return {
    ...actual,
    Slider: (props: SliderProps) => (
      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={props['aria-labelledby']}
        aria-valuenow={props.value?.[0]}
        onClick={() => props.onValueChange?.([100])}
        onKeyUp={() => props.onValueCommit?.([100])}
        onLostPointerCapture={props.onLostPointerCapture}
      />
    ),
  }
})

describe('ThemeColorSettings', () => {
  beforeEach(() => {
    resetOverrides.mockReset()
    setOverride.mockReset()
    mockUseFlag.mockReset()
    mockUseFlag.mockReturnValue(true)
    document.documentElement.style.removeProperty('--chroma')
    document.documentElement.style.removeProperty('--primary-hue')
    document.documentElement.dataset.theme = 'dark'
  })

  it('persists a rapid pointer change for the active mode', () => {
    customRender(<ThemeColorSettings />)

    const slider = screen.getByRole('slider', { name: 'Surface tint' })
    fireEvent.click(slider)
    fireEvent.lostPointerCapture(slider)

    expect(setOverride).toHaveBeenCalledWith('chroma', 0.04)
  })

  it('persists an ordinary committed change', () => {
    customRender(<ThemeColorSettings />)

    const slider = screen.getByRole('slider', { name: 'Surface tint' })
    fireEvent.click(slider)
    fireEvent.keyUp(slider)

    expect(setOverride).toHaveBeenCalledWith('chroma', 0.04)
  })

  it('previews and saves the spot color hue when the flag is on', async () => {
    customRender(<ThemeColorSettings />)

    expect(screen.getByText('158°')).toBeInTheDocument()

    const slider = screen.getByRole('slider', { name: 'Spot color' })
    fireEvent.click(slider)

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--primary-hue')).toBe('360')
    })
    expect(await screen.findByText('360°')).toBeInTheDocument()

    fireEvent.keyUp(slider)
    expect(setOverride).toHaveBeenCalledWith('primaryHue', 360)
  })

  it('hides the spot color control when the employee-only flag is off', () => {
    mockUseFlag.mockReturnValue(false)
    customRender(<ThemeColorSettings />)

    expect(screen.queryByRole('slider', { name: 'Spot color' })).not.toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Surface tint' })).toBeInTheDocument()
  })

  it('cancels a queued hue preview when the flag turns off', async () => {
    const { rerender } = customRender(<ThemeColorSettings />)
    fireEvent.click(screen.getByRole('slider', { name: 'Spot color' }))

    mockUseFlag.mockReturnValue(false)
    rerender(<ThemeColorSettings />)

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(document.documentElement.style.getPropertyValue('--primary-hue')).toBe('')
    expect(screen.queryByRole('slider', { name: 'Spot color' })).not.toBeInTheDocument()
  })

  it('resets the active mode', () => {
    customRender(<ThemeColorSettings />)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(resetOverrides).toHaveBeenCalledOnce()
  })

  it('restores persisted values when an active preview unmounts', async () => {
    const { unmount } = customRender(<ThemeColorSettings />)

    fireEvent.click(screen.getByRole('slider', { name: 'Surface tint' }))
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--chroma')).toBe('0.04')
    })

    unmount()

    expect(document.documentElement.style.getPropertyValue('--chroma')).toBe('0.02')
  })
})
