import { act, render, screen } from '@testing-library/react'
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AIAssistantOption } from './AIAssistantOption'
import { NO_PROJECT_MARKER } from './SupportForm.utils'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
  motion: {
    aside: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      ...props
    }: PropsWithChildren<
      ComponentProps<'aside'> & { initial?: unknown; animate?: unknown; exit?: unknown }
    >) => <aside {...props}>{children}</aside>,
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, ...props }: PropsWithChildren<ComponentProps<'a'>>) => (
    <a {...props}>{children}</a>
  ),
}))

vi.mock('ui', () => ({
  AiIconAnimation: () => null,
  Button: ({
    children,
    icon: _icon,
    ...props
  }: PropsWithChildren<ComponentProps<'button'> & { icon?: ReactNode }>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => vi.fn(),
}))

describe('AIAssistantOption', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    { projectRef: null, expectedProjectRef: '_' },
    { projectRef: undefined, expectedProjectRef: '_' },
    { projectRef: NO_PROJECT_MARKER, expectedProjectRef: '_' },
    { projectRef: 'project-123', expectedProjectRef: 'project-123' },
  ])(
    'links to the correct assistant project route for $projectRef',
    ({ projectRef, expectedProjectRef }) => {
      render(<AIAssistantOption projectRef={projectRef} organizationSlug="org-123" />)

      act(() => {
        vi.advanceTimersByTime(800)
      })

      expect(screen.getByRole('link', { name: 'Ask the Assistant' })).toHaveAttribute(
        'href',
        `/project/${expectedProjectRef}?sidebar=ai-assistant&slug=org-123`
      )
    }
  )
})
