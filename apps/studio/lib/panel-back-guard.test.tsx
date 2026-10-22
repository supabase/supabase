import { fireEvent, screen, waitFor } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { parseAsBoolean } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { usePanelQueryState } from '@/hooks/ui/usePanelQueryState'
import { resetPanelHistoryForTests } from '@/lib/panel-history'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

function DirtyPanelInner() {
  const [open, setOpen] = usePanelQueryState(
    'edit',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => true,
    onClose: () => setOpen(null),
    active: !!open,
  })

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open panel
      </button>
      <button type="button" onClick={confirmOnClose}>
        Close panel
      </button>
      {open ? <p>panel open</p> : null}
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}

function DirtyPanel() {
  return (
    <NuqsAdapter>
      <DirtyPanelInner />
    </NuqsAdapter>
  )
}

describe('dirty panel back', () => {
  beforeEach(() => {
    resetPanelHistoryForTests()
    window.history.replaceState(null, '', '/project/default/database/hooks')
  })

  it('restores the entry and asks before discarding edits', async () => {
    customRender(<DirtyPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Open panel' }))
    expect(await screen.findByText('panel open')).toBeInTheDocument()

    window.history.back()

    expect(await screen.findByRole('alertdialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    expect(screen.getByText('panel open')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(screen.queryByText('panel open')).not.toBeInTheDocument())
  })
})
