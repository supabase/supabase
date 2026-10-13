import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { UploadConflicts } from './StorageExplorer.utils'
import { UploadConflictModal } from './UploadConflictModal'
import { customRender } from '@/tests/lib/custom-render'

const renderModal = (conflicts: Partial<UploadConflicts>) => {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()
  customRender(
    <UploadConflictModal
      conflicts={{
        liveNames: [],
        archivedNames: [],
        isVersioningSuspended: false,
        ...conflicts,
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
  return { onCancel, onConfirm }
}

describe('UploadConflictModal', () => {
  it('stays closed when nothing clashes', () => {
    renderModal({})

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('names the file that is already there', () => {
    renderModal({ liveNames: ['photo.png'] })

    expect(screen.getByText('photo.png already exists here')).toBeInTheDocument()
    expect(screen.getByText('Replace existing file')).toBeInTheDocument()
    expect(screen.getByText('Keep both files')).toBeInTheDocument()
  })

  it('counts and lists the files when several clash', () => {
    renderModal({ liveNames: ['photo.png', 'notes.txt'] })

    expect(screen.getByText('2 files already exist here')).toBeInTheDocument()
    expect(screen.getByText('Replace existing files')).toBeInTheDocument()
    const list = screen.getByRole('list')
    expect(within(list).getByText('photo.png')).toBeInTheDocument()
    expect(within(list).getByText('notes.txt')).toBeInTheDocument()
  })

  it('replaces by default, since that is what versioning retains', async () => {
    const { onConfirm } = renderModal({ liveNames: ['photo.png'] })

    await userEvent.click(screen.getByRole('button', { name: 'Upload' }))

    expect(onConfirm).toHaveBeenCalledWith('replace')
  })

  it('keeps both files when the user picks that instead', async () => {
    const { onConfirm } = renderModal({ liveNames: ['photo.png'] })

    await userEvent.click(screen.getByRole('radio', { name: /Keep both files/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }))

    expect(onConfirm).toHaveBeenCalledWith('keep-both')
  })

  it('cancels the upload rather than guessing', async () => {
    const { onCancel, onConfirm } = renderModal({ liveNames: ['photo.png'] })

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('says the retention only holds once when versioning is suspended', () => {
    renderModal({ liveNames: ['photo.png'], isVersioningSuspended: true })

    expect(screen.getByText('Replace existing file')).toBeInTheDocument()
    expect(screen.getByText(/one last time/)).toBeInTheDocument()
  })

  describe('archived conflicts', () => {
    it('offers a restore rather than a replace', () => {
      renderModal({ archivedNames: ['icon-1.svg'] })

      expect(screen.getByText('icon-1.svg already exists and is archived')).toBeInTheDocument()
      expect(screen.getByText('Restore and add a new version')).toBeInTheDocument()
      expect(screen.queryByText('Replace existing file')).not.toBeInTheDocument()
    })

    it('still reports the choice as a replace, which is what the upload does', async () => {
      const { onConfirm } = renderModal({ archivedNames: ['icon-1.svg'] })

      await userEvent.click(screen.getByRole('button', { name: 'Upload' }))

      expect(onConfirm).toHaveBeenCalledWith('replace')
    })

    it('marks which of the listed names are archived', () => {
      renderModal({ liveNames: ['photo.png'], archivedNames: ['icon-1.svg'] })

      expect(screen.getByText('2 files already exist here')).toBeInTheDocument()
      expect(screen.getByText('Replace and restore')).toBeInTheDocument()

      const archivedRow = screen.getByText('icon-1.svg').closest('li')
      expect(within(archivedRow!).getByText('Archived')).toBeInTheDocument()
      expect(
        within(screen.getByText('photo.png').closest('li')!).queryByText('Archived')
      ).toBeNull()
    })
  })
})
