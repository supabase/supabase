import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { UploadConflictModal } from './UploadConflictModal'
import { customRender } from '@/tests/lib/custom-render'

const renderModal = (conflictingNames: string[]) => {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()
  customRender(
    <UploadConflictModal
      conflictingNames={conflictingNames}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
  return { onCancel, onConfirm }
}

describe('UploadConflictModal', () => {
  it('stays closed when nothing clashes', () => {
    renderModal([])

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('names the file that is already there', () => {
    renderModal(['photo.png'])

    expect(screen.getByText('photo.png already exists here')).toBeInTheDocument()
    expect(screen.getByText('Replace existing file')).toBeInTheDocument()
    expect(screen.getByText('Keep both files')).toBeInTheDocument()
  })

  it('counts and lists the files when several clash', () => {
    renderModal(['photo.png', 'notes.txt'])

    expect(screen.getByText('2 files already exist here')).toBeInTheDocument()
    expect(screen.getByText('Replace existing files')).toBeInTheDocument()
    const list = screen.getByRole('list')
    expect(within(list).getByText('photo.png')).toBeInTheDocument()
    expect(within(list).getByText('notes.txt')).toBeInTheDocument()
  })

  it('replaces by default, since that is what versioning retains', async () => {
    const { onConfirm } = renderModal(['photo.png'])

    await userEvent.click(screen.getByRole('button', { name: 'Upload' }))

    expect(onConfirm).toHaveBeenCalledWith('replace')
  })

  it('keeps both files when the user picks that instead', async () => {
    const { onConfirm } = renderModal(['photo.png'])

    await userEvent.click(screen.getByRole('radio', { name: /Keep both files/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }))

    expect(onConfirm).toHaveBeenCalledWith('keep-both')
  })

  it('cancels the upload rather than guessing', async () => {
    const { onCancel, onConfirm } = renderModal(['photo.png'])

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
