import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import CopyButton from '@/components/ui/CopyButton'
import { customRender } from '@/tests/lib/custom-render'

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

beforeEach(() => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  vi.stubGlobal('ClipboardItem', undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
}

test('confirms copied text only after the clipboard write succeeds', async () => {
  let resolveWrite: () => void = () => {}
  const pendingWrite = new Promise<void>((resolve) => {
    resolveWrite = resolve
  })
  const writeText = vi.fn(() => pendingWrite)
  mockClipboard(writeText)
  const onClick = vi.fn()
  customRender(<CopyButton asyncText={() => Promise.resolve('some text')} onClick={onClick} />)
  fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('some text'))
  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  expect(onClick).toHaveBeenCalledOnce()
  await act(async () => resolveWrite())
  expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
})

test('keeps the copy action available and reports a failed clipboard write', async () => {
  mockClipboard(() => Promise.reject(new Error('Clipboard denied')))
  customRender(
    <>
      <CopyButton text="some text" />
      <Toaster />
    </>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
  expect(await screen.findByText('Unable to copy to clipboard')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument()
})
