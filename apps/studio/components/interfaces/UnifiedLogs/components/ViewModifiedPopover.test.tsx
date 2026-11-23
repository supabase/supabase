import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ViewModifiedPopover } from './ViewModifiedPopover'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

const anchorRef = createRef<HTMLElement>()

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  anchorRef,
  viewName: 'Errors only',
  onUpdate: vi.fn(),
  onSaveAsNew: vi.fn(),
  onReset: vi.fn(),
  onDismiss: vi.fn(),
}

describe('ViewModifiedPopover', () => {
  it('renders nothing when closed', () => {
    customRender(<ViewModifiedPopover {...baseProps} open={false} />)

    expect(screen.queryByText('This view has been modified')).toBeNull()
  })

  it('shows the heading and names the view when open', async () => {
    customRender(<ViewModifiedPopover {...baseProps} />)

    expect(await screen.findByText('This view has been modified')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Update "Errors only" for everyone in the project, or save these filters as a new view.'
      )
    ).toBeInTheDocument()
  })

  it('truncates a long view name', async () => {
    customRender(<ViewModifiedPopover {...baseProps} viewName={'a'.repeat(64)} />)

    expect(await screen.findByText(/^Update "a{31}…"/)).toBeInTheDocument()
  })

  it('calls onUpdate from Update view', async () => {
    const onUpdate = vi.fn()
    customRender(<ViewModifiedPopover {...baseProps} onUpdate={onUpdate} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Update view' }))

    expect(onUpdate).toHaveBeenCalledOnce()
  })

  it('calls onSaveAsNew from Save as new', async () => {
    const onSaveAsNew = vi.fn()
    customRender(<ViewModifiedPopover {...baseProps} onSaveAsNew={onSaveAsNew} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Save as new' }))

    expect(onSaveAsNew).toHaveBeenCalledOnce()
  })

  it('calls onReset from Reset', async () => {
    const onReset = vi.fn()
    customRender(<ViewModifiedPopover {...baseProps} onReset={onReset} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Reset' }))

    expect(onReset).toHaveBeenCalledOnce()
  })

  it('dismisses from the X button', async () => {
    const onDismiss = vi.fn()
    customRender(<ViewModifiedPopover {...baseProps} onDismiss={onDismiss} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dismisses on Escape', async () => {
    const onDismiss = vi.fn()
    customRender(<ViewModifiedPopover {...baseProps} onDismiss={onDismiss} />)

    await screen.findByText('This view has been modified')
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })

    expect(onDismiss).toHaveBeenCalled()
  })

  it('hides Update view without permission to update', async () => {
    customRender(<ViewModifiedPopover {...baseProps} canUpdate={false} />)

    await screen.findByText('This view has been modified')
    expect(screen.queryByRole('button', { name: 'Update view' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Save as new' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('hides Save as new without permission to create', async () => {
    customRender(<ViewModifiedPopover {...baseProps} canCreate={false} />)

    await screen.findByText('This view has been modified')
    expect(screen.queryByRole('button', { name: 'Save as new' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Update view' })).toBeInTheDocument()
  })

  it('explains a preset cannot be updated and offers save as new', async () => {
    customRender(<ViewModifiedPopover {...baseProps} isPreset canUpdate={false} />)

    expect(
      await screen.findByText(
        "Preset views can't be updated. Save these filters as a new view instead."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save as new' })).toBeInTheDocument()
  })

  it('explains a preset cannot be updated or saved without write access', async () => {
    customRender(
      <ViewModifiedPopover {...baseProps} isPreset canUpdate={false} canCreate={false} />
    )

    expect(
      await screen.findByText("Preset views can't be updated. Reset to discard these filters.")
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save as new' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('explains read-only access and keeps Reset when neither is allowed', async () => {
    customRender(<ViewModifiedPopover {...baseProps} canUpdate={false} canCreate={false} />)

    expect(
      await screen.findByText('Only members with write access can update views.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Update view' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save as new' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })
})
