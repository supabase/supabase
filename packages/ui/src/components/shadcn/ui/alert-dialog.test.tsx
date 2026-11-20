import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, reject, resolve }
}

const TestAlertDialog = ({
  action,
  actionLabel = 'Continue',
  actionLoading,
}: {
  action?: () => void | Promise<void>
  actionLabel?: string
  actionLoading?: boolean
}) => (
  <AlertDialog defaultOpen>
    <AlertDialogTrigger>Open</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirm action</AlertDialogTitle>
        <AlertDialogDescription>This action needs confirmation.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction loading={actionLoading} onClick={action}>
          {actionLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

describe('#AlertDialog', () => {
  it('closes after a synchronous action', async () => {
    const onAction = vi.fn()

    render(<TestAlertDialog action={onAction} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('keeps the dialog open and shows loading while an async action is pending', async () => {
    const deferred = createDeferred<void>()
    render(<TestAlertDialog action={() => deferred.promise} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('closes after an async action resolves', async () => {
    const deferred = createDeferred<void>()

    render(<TestAlertDialog action={() => deferred.promise} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await act(async () => {
      deferred.resolve()
      await deferred.promise
    })

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('keeps the dialog open after an async action rejects', async () => {
    const deferred = createDeferred<void>()

    render(<TestAlertDialog action={() => deferred.promise} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await act(async () => {
      deferred.reject(new Error('Unable to complete action'))
      await deferred.promise.catch(() => undefined)
    })

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  it('blocks cancel, Escape, and outside interaction while an async action is pending', () => {
    const deferred = createDeferred<void>()

    render(<TestAlertDialog action={() => deferred.promise} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('disables action and cancel when loading is controlled by a parent', () => {
    render(<TestAlertDialog actionLoading />)

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('uses the latest onOpenChange callback after a rerender', () => {
    const firstOnOpenChange = vi.fn()
    const secondOnOpenChange = vi.fn()

    const InlineCallbackDialog = ({ label }: { label: string }) => {
      const onOpenChange = (open: boolean) => {
        if (label === 'first') firstOnOpenChange(label, open)
        else secondOnOpenChange(label, open)
      }

      return (
        <AlertDialog defaultOpen onOpenChange={onOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm action</AlertDialogTitle>
              <AlertDialogDescription>This action needs confirmation.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    const { rerender } = render(<InlineCallbackDialog label="first" />)

    rerender(<InlineCallbackDialog label="latest" />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(firstOnOpenChange).not.toHaveBeenCalled()
    expect(secondOnOpenChange).toHaveBeenCalledWith('latest', false)
  })
})
