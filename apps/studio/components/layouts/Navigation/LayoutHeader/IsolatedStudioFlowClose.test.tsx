import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import {
  IsolatedStudioFlowCloseButton,
  IsolatedStudioFlowCloseProvider,
  IsolatedStudioFlowExit,
} from './IsolatedStudioFlowClose'
import { customRender } from '@/tests/lib/custom-render'

describe('IsolatedStudioFlowClose', () => {
  test('uses the fallback when nothing is registered', () => {
    const fallbackClose = vi.fn()

    customRender(
      <IsolatedStudioFlowCloseProvider fallbackClose={fallbackClose}>
        <IsolatedStudioFlowCloseButton />
      </IsolatedStudioFlowCloseProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(fallbackClose).toHaveBeenCalledOnce()
  })

  test('prefers a registered handler over the fallback', () => {
    const fallbackClose = vi.fn()
    const onClose = vi.fn()

    customRender(
      <IsolatedStudioFlowCloseProvider fallbackClose={fallbackClose}>
        <IsolatedStudioFlowExit onClose={onClose}>
          <IsolatedStudioFlowCloseButton />
        </IsolatedStudioFlowExit>
      </IsolatedStudioFlowCloseProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(fallbackClose).not.toHaveBeenCalled()
  })

  test('restores the fallback after the registered handler unmounts', () => {
    const fallbackClose = vi.fn()
    const onClose = vi.fn()

    const { rerender } = customRender(
      <IsolatedStudioFlowCloseProvider fallbackClose={fallbackClose}>
        <IsolatedStudioFlowExit onClose={onClose}>
          <IsolatedStudioFlowCloseButton />
        </IsolatedStudioFlowExit>
      </IsolatedStudioFlowCloseProvider>
    )

    rerender(
      <IsolatedStudioFlowCloseProvider fallbackClose={fallbackClose}>
        <IsolatedStudioFlowCloseButton />
      </IsolatedStudioFlowCloseProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(fallbackClose).toHaveBeenCalledOnce()
  })
})
