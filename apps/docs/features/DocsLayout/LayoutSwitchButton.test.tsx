// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useIaNavVariant } from '~/features/IaNav/useIaNavVariant'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { LayoutSwitchButton } from './LayoutSwitchButton'

const { sendTelemetryEvent, insert } = vi.hoisted(() => ({
  sendTelemetryEvent: vi.fn(),
  insert: vi.fn(async (_row: unknown) => ({ error: null })),
}))

vi.mock('~/features/IaNav/useIaNavVariant', () => ({ useIaNavVariant: vi.fn() }))
vi.mock('~/features/IaNav/useIaNavReady', () => ({ useIaNavReady: () => true }))
vi.mock('~/features/IaNav/IaNavRouteProvider', () => ({
  useIaNavRouteVariant: () => null,
  useDocsPathname: () => '/guides/database/prisma',
}))
vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => sendTelemetryEvent }))
vi.mock('~/lib/constants', () => ({ IS_PLATFORM: true }))
vi.mock('~/lib/supabase', () => ({ supabase: () => ({ from: () => ({ insert }) }) }))
vi.mock('next/navigation', () => ({ usePathname: () => '/guides/database/prisma' }))

const readLayoutChoice = () => localStorage.getItem(LOCAL_STORAGE_KEYS.DOCS_LAYOUT_CHOICE)

beforeEach(() => {
  vi.mocked(useIaNavVariant).mockReturnValue('option-1')
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

it('asks for a reason before it switches back to classic', () => {
  render(<LayoutSwitchButton />)
  expect(screen.queryByRole('dialog')).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: 'Switch to classic layout' }))
  expect(screen.getByRole('dialog')).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(readLayoutChoice()).toBeNull()
})

it('switches to the new layout in one click and records the switch', () => {
  vi.mocked(useIaNavVariant).mockReturnValue('control')
  render(<LayoutSwitchButton />)

  fireEvent.click(screen.getByRole('button', { name: 'Switch to new layout' }))

  expect(readLayoutChoice()).toBe('option-1')
  expect(sendTelemetryEvent).toHaveBeenCalledWith({
    action: 'docs_layout_updated',
    properties: { layoutVariant: 'option-1' },
  })
})

it('stores the reason as a layout switch comment, then switches to classic', async () => {
  render(<LayoutSwitchButton />)
  fireEvent.click(screen.getByRole('button', { name: 'Switch to classic layout' }))
  const dialog = screen.getByRole('dialog')

  fireEvent.change(within(dialog).getByRole('textbox'), {
    target: { value: 'I miss the product list' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Switch to classic layout' }))

  await waitFor(() => expect(readLayoutChoice()).toBe('control'))
  expect(insert.mock.calls[0]?.[0]).toMatchObject({
    comment: 'I miss the product list',
    metadata: { source: 'docs_layout_switch' },
  })
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('switches to classic without a stored row when the reason is empty', async () => {
  render(<LayoutSwitchButton />)
  fireEvent.click(screen.getByRole('button', { name: 'Switch to classic layout' }))
  const dialog = screen.getByRole('dialog')

  fireEvent.click(within(dialog).getByRole('button', { name: 'Switch to classic layout' }))

  await waitFor(() => expect(readLayoutChoice()).toBe('control'))
  expect(insert).not.toHaveBeenCalled()
})

it('returns keyboard focus to the switch button when the dialog closes', async () => {
  render(<LayoutSwitchButton />)
  const button = screen.getByRole('button', { name: 'Switch to classic layout' })
  fireEvent.click(button)

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  await waitFor(() => expect(document.activeElement).toBe(button))
})
