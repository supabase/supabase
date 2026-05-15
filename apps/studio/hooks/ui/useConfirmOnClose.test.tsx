import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useConfirmOnClose } from './useConfirmOnClose'

describe('useConfirmOnClose', () => {
  it('closes immediately when the form is clean', () => {
    const onClose = vi.fn()

    const { result } = renderHook(() =>
      useConfirmOnClose({
        checkIsDirty: () => false,
        onClose,
      })
    )

    act(() => {
      result.current.confirmOnClose()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(result.current.modalProps.visible).toBe(false)
  })

  it('opens the confirmation modal when the form is dirty', () => {
    const onClose = vi.fn()

    const { result } = renderHook(() =>
      useConfirmOnClose({
        checkIsDirty: () => true,
        onClose,
      })
    )

    act(() => {
      result.current.confirmOnClose()
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(result.current.modalProps.visible).toBe(true)
  })

  it('ignores open events and handles close events via handleOpenChange', () => {
    const onClose = vi.fn()

    const { result } = renderHook(() =>
      useConfirmOnClose({
        checkIsDirty: () => true,
        onClose,
      })
    )

    act(() => {
      result.current.handleOpenChange(true)
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(result.current.modalProps.visible).toBe(false)

    act(() => {
      result.current.handleOpenChange(false)
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(result.current.modalProps.visible).toBe(true)
  })

  it('confirms and closes after the discard modal is accepted', () => {
    const onClose = vi.fn()

    const { result } = renderHook(() =>
      useConfirmOnClose({
        checkIsDirty: () => true,
        onClose,
      })
    )

    act(() => {
      result.current.confirmOnClose()
    })

    expect(result.current.modalProps.visible).toBe(true)

    act(() => {
      result.current.modalProps.onClose()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(result.current.modalProps.visible).toBe(false)
  })

  it('cancels and keeps the form open after the discard modal is dismissed', () => {
    const onClose = vi.fn()

    const { result } = renderHook(() =>
      useConfirmOnClose({
        checkIsDirty: () => true,
        onClose,
      })
    )

    act(() => {
      result.current.confirmOnClose()
    })

    expect(result.current.modalProps.visible).toBe(true)

    act(() => {
      result.current.modalProps.onCancel()
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(result.current.modalProps.visible).toBe(false)
  })

  it('uses the latest checkIsDirty and onClose callbacks', () => {
    const onCloseA = vi.fn()
    const onCloseB = vi.fn()
    let isDirty = false

    const { result, rerender } = renderHook(
      ({ onClose }: { onClose: () => void }) =>
        useConfirmOnClose({
          checkIsDirty: () => isDirty,
          onClose,
        }),
      {
        initialProps: { onClose: onCloseA },
      }
    )

    act(() => {
      result.current.confirmOnClose()
    })

    expect(onCloseA).toHaveBeenCalledTimes(1)

    isDirty = true
    rerender({ onClose: onCloseB })

    act(() => {
      result.current.confirmOnClose()
    })

    expect(result.current.modalProps.visible).toBe(true)

    act(() => {
      result.current.modalProps.onClose()
    })

    expect(onCloseB).toHaveBeenCalledTimes(1)
  })
})
