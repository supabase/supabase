import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { parseAsBoolean } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { usePanelQueryState } from '@/hooks/ui/usePanelQueryState'
import { resetPanelHistoryForTests } from '@/lib/panel-history'
import { customRender } from '@/tests/lib/custom-render'
import {
  installNavigationDouble,
  uninstallNavigationDouble,
  userTraverse,
} from '@/tests/lib/panel-navigation-double'

mockAnimationsApi()

function DirtyPanelInner() {
  const [open, setOpen] = usePanelQueryState(
    'edit',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push' })
  )
  const isOpen = open === true
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => true,
    onClose: () => setOpen(null),
    active: isOpen,
  })

  return (
    <>
      <button type="button" tabIndex={0} onClick={() => setOpen(true)}>
        Open panel
      </button>
      <button type="button" tabIndex={0} onClick={confirmOnClose}>
        Close panel
      </button>
      {isOpen ? <p>panel open</p> : null}
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
    installNavigationDouble()
    window.history.replaceState(null, '', '/project/default/database/hooks')
  })

  afterEach(() => {
    resetPanelHistoryForTests()
    uninstallNavigationDouble()
  })

  it('keeps the url and the panel when Back is canceled, then discards on confirm', async () => {
    customRender(<DirtyPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Open panel' }))
    expect(await screen.findByText('panel open')).toBeInTheDocument()
    await waitFor(() => expect(window.location.search).toBe('?edit=true'))

    act(() => {
      userTraverse(-1)
    })

    expect(await screen.findByRole('alertdialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    expect(screen.getByText('panel open')).toBeInTheDocument()
    expect(window.location.search).toBe('?edit=true')

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { name: 'Unsaved changes' })).not.toBeInTheDocument()
    )
    expect(screen.getByText('panel open')).toBeInTheDocument()
    expect(window.location.search).toBe('?edit=true')

    act(() => {
      userTraverse(-1)
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))

    await waitFor(() => expect(screen.queryByText('panel open')).not.toBeInTheDocument())
    expect(window.location.search).toBe('')
  })
})
