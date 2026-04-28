// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PrivacySettings } from './index'

const updateServices = vi.fn()

const categories = [
  {
    slug: 'essential',
    label: 'Essential',
    description: 'Required for site operation',
    isEssential: true,
    services: [{ id: 'essential-1', consent: { status: true } }],
  },
  {
    slug: 'analytics',
    label: 'Analytics',
    description: 'Measure product usage',
    isEssential: false,
    services: [{ id: 'analytics-1', consent: { status: true } }],
  },
  {
    slug: 'marketing',
    label: 'Marketing',
    description: 'Track campaign performance',
    isEssential: false,
    services: [{ id: 'marketing-1', consent: { status: true } }],
  },
]

// Mutable so individual tests can simulate the SDK init window where
// `categories` starts null and arrives asynchronously. Reset to the
// populated default in beforeEach.
let mockCategories: typeof categories | null = categories

vi.mock('common', () => ({
  useConsentState: () => ({
    categories: mockCategories,
    updateServices,
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// The Admonition component pulls in Shadcn primitives we don't otherwise need;
// stub it out to keep the mock surface minimal.
vi.mock('../admonition', () => ({
  Admonition: ({ title }: { title: string }) => <div role="alert">{title}</div>,
}))

vi.mock('ui', () => {
  const Modal = ({
    children,
    visible,
    onConfirm,
    onCancel,
    header,
  }: {
    children: React.ReactNode
    visible?: boolean
    onConfirm?: () => void
    onCancel?: () => void
    header?: string
  }) =>
    visible ? (
      <div>
        <div>{header}</div>
        {children}
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null

  Modal.Content = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

  const Toggle = ({
    checked,
    disabled,
    onChange,
    label,
    descriptionText,
  }: {
    checked: boolean
    disabled?: boolean
    onChange?: () => void
    label: string
    descriptionText?: React.ReactNode
  }) => (
    <label>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {label}
      {descriptionText}
    </label>
  )

  return { Modal, Toggle }
})

describe('PrivacySettings', () => {
  beforeEach(() => {
    updateServices.mockReset()
    mockCategories = categories
  })

  it('submits the full non-essential decision set after toggling one category', async () => {
    const user = userEvent.setup()

    render(<PrivacySettings>Privacy settings</PrivacySettings>)

    await user.click(screen.getByRole('button', { name: 'Privacy settings' }))
    await user.click(screen.getByRole('checkbox', { name: 'Marketing' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(updateServices).toHaveBeenCalledTimes(1)

    const decisions = updateServices.mock.calls[0][0]
    expect(decisions).toHaveLength(2)
    expect(decisions).toEqual(
      expect.arrayContaining([
        { serviceId: 'analytics-1', status: true },
        { serviceId: 'marketing-1', status: false },
      ])
    )
  })

  // Race window: user opens the modal during SDK init while `categories`
  // is still null. The modal renders the "Unable to Load Privacy Settings"
  // admonition (no toggles). Then `categories` arrives asynchronously and
  // toggles render. Without the categories-aware reseed effect, the
  // `serviceConsentMap` would still be empty, and a subsequent toggle +
  // Confirm would submit only the toggled service — exactly the partial-
  // submit bug this fix is meant to prevent.
  it('reseeds the consent map when categories transition from null to populated while the modal is open', async () => {
    mockCategories = null

    const user = userEvent.setup()
    const { rerender } = render(<PrivacySettings>Privacy settings</PrivacySettings>)

    // Open modal during the SDK init window
    await user.click(screen.getByRole('button', { name: 'Privacy settings' }))

    // No toggles render while categories is null
    expect(screen.queryByRole('checkbox', { name: 'Marketing' })).not.toBeInTheDocument()

    // Categories arrive — simulate by updating the mock value and re-rendering
    mockCategories = categories
    rerender(<PrivacySettings>Privacy settings</PrivacySettings>)

    // Toggles now render, and the useEffect should have reseeded the map
    expect(screen.getByRole('checkbox', { name: 'Marketing' })).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Marketing' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(updateServices).toHaveBeenCalledTimes(1)
    const decisions = updateServices.mock.calls[0][0]
    expect(decisions).toHaveLength(2)
    expect(decisions).toEqual(
      expect.arrayContaining([
        { serviceId: 'analytics-1', status: true },
        { serviceId: 'marketing-1', status: false },
      ])
    )
  })
})
