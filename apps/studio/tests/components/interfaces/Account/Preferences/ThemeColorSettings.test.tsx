import { fireEvent, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type * as UI from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeColorSettings } from '@/components/interfaces/Account/Preferences/ThemeColorSettings'
import { customRender } from '@/tests/lib/custom-render'

type SliderProps = ComponentProps<typeof UI.Slider>

const { resetOverrides, setOverride } = vi.hoisted(() => ({
  resetOverrides: vi.fn(),
  setOverride: vi.fn(),
}))

vi.mock('@/hooks/misc/useThemeOverrides', () => ({
  useThemeOverrides: () => ({
    mode: 'dark',
    overrides: { chroma: 0.02 },
    resetOverrides,
    setOverride,
  }),
}))

vi.mock('ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui')>()

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
    document.documentElement.style.removeProperty('--chroma')
    document.documentElement.dataset.theme = 'dark'
  })

  it('persists a rapid pointer change for the active mode', () => {
    customRender(<ThemeColorSettings />)

    const slider = screen.getByRole('slider', { name: 'Color intensity' })
    fireEvent.click(slider)
    fireEvent.lostPointerCapture(slider)

    expect(setOverride).toHaveBeenCalledWith('chroma', 0.04)
  })

  it('persists an ordinary committed change', () => {
    customRender(<ThemeColorSettings />)

    const slider = screen.getByRole('slider', { name: 'Color intensity' })
    fireEvent.click(slider)
    fireEvent.keyUp(slider)

    expect(setOverride).toHaveBeenCalledWith('chroma', 0.04)
  })

  it('resets the active mode', () => {
    customRender(<ThemeColorSettings />)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(resetOverrides).toHaveBeenCalledOnce()
  })

  it('restores persisted values when an active preview unmounts', () => {
    const { unmount } = customRender(<ThemeColorSettings />)

    fireEvent.click(screen.getByRole('slider', { name: 'Color intensity' }))
    expect(document.documentElement.style.getPropertyValue('--chroma')).toBe('0.04')

    unmount()

    expect(document.documentElement.style.getPropertyValue('--chroma')).toBe('0.02')
  })
})
