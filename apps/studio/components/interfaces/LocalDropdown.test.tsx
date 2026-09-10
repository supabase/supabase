import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MouseEventHandler, ReactElement, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocalDropdown } from './LocalDropdown'

const {
  mockRouter,
  mockSetTheme,
  mockSetLastRoute,
  mockToggleFeaturePreviewModal,
  mockEnableToolbar,
  mockDismissDevToolbar,
  mockSetDevToolbarOpen,
  mockUseDevToolbar,
} = vi.hoisted(() => ({
  mockRouter: {
    pathname: '/project/[ref]/editor',
    asPath: '/project/default/editor',
  },
  mockSetTheme: vi.fn(),
  mockSetLastRoute: vi.fn(),
  mockToggleFeaturePreviewModal: vi.fn(),
  mockEnableToolbar: vi.fn(),
  mockDismissDevToolbar: vi.fn(),
  mockSetDevToolbarOpen: vi.fn(),
  mockUseDevToolbar: vi.fn(() => ({
    isAvailable: false,
    isEnabled: false,
    isOpen: false,
    setIsOpen: mockSetDevToolbarOpen,
    enableToolbar: mockEnableToolbar,
    dismissToolbar: mockDismissDevToolbar,
    events: [],
    setEvents: vi.fn(),
  })),
}))

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string
    children: ReactNode
    onClick?: MouseEventHandler<HTMLAnchorElement>
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: mockSetTheme,
  }),
}))

vi.mock('@/state/app-state', () => ({
  useAppStateSnapshot: () => ({
    setLastRouteBeforeVisitingAccountPage: mockSetLastRoute,
  }),
}))

vi.mock('@/components/ui/ProfileImage', () => ({
  ProfileImage: () => <div>Avatar</div>,
}))

vi.mock('./App/FeaturePreview/FeaturePreviewContext', () => ({
  useFeaturePreviewModal: () => ({
    toggleFeaturePreviewModal: mockToggleFeaturePreviewModal,
  }),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

vi.mock('dev-tools', () => ({
  useDevToolbar: () => mockUseDevToolbar(),
}))

vi.mock('ui', async () => {
  const React = await import('react')

  return {
    Button: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) => (
      <button tabIndex={0} {...props}>
        {children}
      </button>
    ),
    cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
    DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DropdownMenuGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({
      children,
      asChild,
      onClick,
      onSelect,
    }: {
      children: ReactNode
      asChild?: boolean
      onClick?: () => void
      onSelect?: () => void
    }) =>
      asChild ? (
        <div>{children}</div>
      ) : (
        <button
          tabIndex={0}
          onClick={() => {
            onClick?.()
            onSelect?.()
          }}
        >
          {children}
        </button>
      ),
    DropdownMenuLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DropdownMenuCheckboxItem: ({
      children,
      checked,
      onCheckedChange,
    }: {
      children: ReactNode
      checked?: boolean
      onCheckedChange?: (checked: boolean) => void
    }) => (
      <button tabIndex={0} aria-checked={checked} onClick={() => onCheckedChange?.(!checked)}>
        {children}
      </button>
    ),
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuRadioGroup: ({
      children,
      onValueChange,
    }: {
      children: ReactNode
      onValueChange: (value: string) => void
    }) => (
      <div>
        {React.Children.map(children, (child: ReactNode) =>
          React.isValidElement<{ value: string; onClick?: () => void }>(child)
            ? React.cloneElement(child, {
                onClick: () => onValueChange(child.props.value),
              })
            : (child as ReactElement)
        )}
      </div>
    ),
    DropdownMenuRadioItem: ({
      children,
      onClick,
    }: {
      children: ReactNode
      onClick?: () => void
    }) => (
      <button tabIndex={0} onClick={onClick}>
        {children}
      </button>
    ),
    Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    singleThemes: [
      { value: 'dark', name: 'Dark' },
      { value: 'light', name: 'Light' },
    ],
  }
})

describe('LocalDropdown', () => {
  beforeEach(() => {
    mockUseDevToolbar.mockReturnValue({
      isAvailable: false,
      isEnabled: false,
      isOpen: false,
      setIsOpen: mockSetDevToolbarOpen,
      enableToolbar: mockEnableToolbar,
      dismissToolbar: mockDismissDevToolbar,
      events: [],
      setEvents: vi.fn(),
    })
  })

  it('shows Preferences, removes Command menu, and keeps theme controls wired', async () => {
    const user = userEvent.setup()

    render(<LocalDropdown />)

    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Command menu')).not.toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.queryByText('Dev toolbar')).not.toBeInTheDocument()

    await user.click(screen.getByText('Preferences'))
    expect(mockSetLastRoute).toHaveBeenCalledWith('/project/default/editor')

    await user.click(screen.getByText('Feature previews'))
    expect(mockToggleFeaturePreviewModal).toHaveBeenCalledWith(true)

    await user.click(screen.getByText('Light'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('toggles Dev toolbar visibility from the menu', async () => {
    mockUseDevToolbar.mockReturnValue({
      isAvailable: true,
      isEnabled: false,
      isOpen: false,
      setIsOpen: mockSetDevToolbarOpen,
      enableToolbar: mockEnableToolbar,
      dismissToolbar: mockDismissDevToolbar,
      events: [],
      setEvents: vi.fn(),
    })

    const user = userEvent.setup()

    render(<LocalDropdown />)

    expect(screen.getByText('Local tools')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dev toolbar' }))

    expect(mockEnableToolbar).toHaveBeenCalled()
    expect(mockDismissDevToolbar).not.toHaveBeenCalled()
  })

  it('hides Dev toolbar from the menu when toggled off', async () => {
    mockUseDevToolbar.mockReturnValue({
      isAvailable: true,
      isEnabled: true,
      isOpen: false,
      setIsOpen: mockSetDevToolbarOpen,
      enableToolbar: mockEnableToolbar,
      dismissToolbar: mockDismissDevToolbar,
      events: [],
      setEvents: vi.fn(),
    })

    const user = userEvent.setup()

    render(<LocalDropdown />)

    await user.click(screen.getByRole('button', { name: 'Dev toolbar' }))

    expect(mockDismissDevToolbar).toHaveBeenCalled()
    expect(mockEnableToolbar).not.toHaveBeenCalled()
  })
})
