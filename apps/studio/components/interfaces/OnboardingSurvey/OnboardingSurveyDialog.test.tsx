import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { BUILDING_MAX_LENGTH } from './OnboardingSurvey.constants'
import { OnboardingSurveyDialog } from './OnboardingSurveyDialog'

type ButtonMockProps = ComponentProps<'button'> & { loading?: boolean }
type SelectMockProps = {
  children: ReactNode
  onValueChange: (value: string) => void
}

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
  Input: (props: ComponentProps<'input'>) => <input {...props} />,
  Label: ({ children, ...props }: ComponentProps<'label'>) => <label {...props}>{children}</label>,
  Select: ({ children, onValueChange }: SelectMockProps) => (
    <div>
      {children}
      <button type="button" onClick={() => onValueChange('ai_tool')}>
        AI tool
      </button>
      <button type="button" onClick={() => onValueChange('conference')}>
        Conference
      </button>
      <button type="button" onClick={() => onValueChange('other')}>
        Other
      </button>
    </div>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  Textarea: (props: ComponentProps<'textarea'>) => <textarea {...props} />,
}))

describe('OnboardingSurveyDialog', () => {
  it('submits optional answers', async () => {
    const onSubmit = vi.fn()

    render(
      <OnboardingSurveyDialog
        open
        onDismiss={vi.fn()}
        onOpenChange={vi.fn()}
        onSkip={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'AI tool' }))
    await userEvent.type(screen.getByLabelText('What are you building?'), 'A SaaS app')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).toHaveBeenCalledWith({
      heard_from: 'ai_tool',
      building: 'A SaaS app',
    })
  })

  it('limits building input to 500 characters', async () => {
    render(
      <OnboardingSurveyDialog
        open
        onDismiss={vi.fn()}
        onOpenChange={vi.fn()}
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    const input = screen.getByLabelText('What are you building?')
    expect(input).toHaveAttribute('maxLength', String(BUILDING_MAX_LENGTH))
  })

  it('submits source details when a follow-up option is selected', async () => {
    const onSubmit = vi.fn()

    render(
      <OnboardingSurveyDialog
        open
        onDismiss={vi.fn()}
        onOpenChange={vi.fn()}
        onSkip={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Conference' }))
    await userEvent.type(screen.getByLabelText('Which conference?'), 'Launch Week')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).toHaveBeenCalledWith({
      heard_from: 'conference: Launch Week',
      building: '',
    })
  })

  it('submits custom details when other is selected', async () => {
    const onSubmit = vi.fn()

    render(
      <OnboardingSurveyDialog
        open
        onDismiss={vi.fn()}
        onOpenChange={vi.fn()}
        onSkip={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Other' }))
    await userEvent.type(screen.getByLabelText('Tell us where'), 'Launch Week')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).toHaveBeenCalledWith({
      heard_from: 'Launch Week',
      building: '',
    })
  })

  it('allows the user to skip', async () => {
    const onSkip = vi.fn()

    render(
      <OnboardingSurveyDialog
        open
        onDismiss={vi.fn()}
        onOpenChange={vi.fn()}
        onSkip={onSkip}
        onSubmit={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onSkip).toHaveBeenCalled()
  })
})
