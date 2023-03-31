import { fireEvent, render, screen } from '@testing-library/react'
import Alert from './Alert'

const VARIANTS = ['success', 'danger', 'warning', 'info']

describe('#Alert', () => {
  it('should render elements correctly', () => {
    render(<Alert title="Required Title">{'Description'}</Alert>)
    expect(screen.queryByText('Required Title')).toBeInTheDocument()
    expect(screen.queryByText('Description')).toBeInTheDocument()
  })

  it('should add custom classes to container div', () => {
    const { container } = render(
      <Alert title="Required Title" className={'custom classes'}>
        {'Description'}
      </Alert>
    )
    expect(container.querySelector('div')).toHaveClass(
      `sbui-alert-container sbui-alert-container--success custom classes`
    )
  })

  it('should close alert when close button clicked', () => {
    render(
      <Alert title="Required Title" closable>
        {'Description'}
      </Alert>
    )

    const closeButton = screen.getByRole('button')

    fireEvent.click(closeButton)

    expect(screen.queryByText('Description')).not.toBeInTheDocument()
  })

  it('should render an icon when passed withIcon', () => {
    const { container } = render(
      <Alert title="Required Title" withIcon>
        {'Description'}
      </Alert>
    )

    expect(
      container.querySelector('div.flex-shrink-0 > svg')
    ).toBeInTheDocument()
  })

  it.each(VARIANTS)(
    'should have "sbui-alert-[container|description]--%s" class',
    (variant) => {
      const { container } = render(
        <Alert title="Required Title" variant={variant}>
          {'Description'}
        </Alert>
      )

      expect(container.querySelector('div')).toHaveClass(
        `sbui-alert-container sbui-alert-container--${variant}`
      )
      expect(screen.queryByText('Description')).toHaveClass(
        `sbui-alert-description sbui-alert-description--${variant}`
      )
    }
  )
})
