import { render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OnboardingSurveyToastPrompt } from './OnboardingSurveyToastPrompt'

type ButtonMockProps = ComponentProps<'button'> & { loading?: boolean }

const { mockAddBanner, mockDismissBanner, mockOpenDialog, promptState } = vi.hoisted(() => ({
  mockAddBanner: vi.fn(),
  mockDismissBanner: vi.fn(),
  mockOpenDialog: vi.fn(),
  promptState: {
    current: {
      dismissPrompt: vi.fn(),
      isSubmitting: false,
      open: false,
      openDialog: vi.fn(),
      setOpen: vi.fn(),
      shouldShowPrompt: true,
      submitSurvey: vi.fn(),
    },
  },
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => vi.fn(),
}))

vi.mock('@/components/ui/BannerStack/BannerCard', () => ({
  BannerCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/BannerStack/BannerStackProvider', () => ({
  BANNER_ID: {
    ONBOARDING_SURVEY: 'onboarding-survey-banner',
  },
  useBannerStack: () => ({
    addBanner: mockAddBanner,
    dismissBanner: mockDismissBanner,
  }),
}))

vi.mock('ui', () => ({
  Button: ({ children, loading, ...props }: ButtonMockProps) => (
    <button {...props} disabled={props.disabled || loading}>
      {children}
    </button>
  ),
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogSectionSeparator: () => <hr />,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  Label: ({ children, ...props }: ComponentProps<'label'>) => <label {...props}>{children}</label>,
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  Textarea: (props: ComponentProps<'textarea'>) => <textarea {...props} />,
}))

vi.mock('./useOnboardingSurveyPrompt', () => ({
  useOnboardingSurveyPrompt: () => ({
    ...promptState.current,
    openDialog: mockOpenDialog,
  }),
}))

describe('OnboardingSurveyToastPrompt', () => {
  afterEach(() => {
    vi.clearAllMocks()
    promptState.current.open = false
    promptState.current.shouldShowPrompt = true
  })

  it('adds the bottom-right banner stack card for the fallback prompt', () => {
    render(<OnboardingSurveyToastPrompt />)

    expect(mockAddBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'onboarding-survey-banner',
        isDismissed: false,
      })
    )
  })

  it('auto-opens the welcome dialog when requested', () => {
    render(<OnboardingSurveyToastPrompt autoOpen />)

    expect(mockOpenDialog).toHaveBeenCalledTimes(1)
  })

  it('uses welcome copy for the auto-open dialog', () => {
    promptState.current.open = true

    render(<OnboardingSurveyToastPrompt autoOpen />)

    expect(screen.getByText('Welcome to Supabase')).toBeTruthy()
    expect(
      screen.getByText(
        'Answer two optional questions about how you found Supabase and what you are building.'
      )
    ).toBeTruthy()
  })
})
