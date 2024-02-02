import { fireEvent, render, screen } from '@testing-library/react'
import defaultTheme from '../../lib/theme/defaultTheme'
import { Alert, AlertVariant } from './Alert'

const VARIANTS: AlertVariant[] = ['success', 'danger', 'warning', 'info', 'neutral']

describe('#Alert', () => {
  it('should render title and description', () => {
    render(<Alert title="Required Title">Description</Alert>)

    expect(screen.queryByText('Required Title')).toBeInTheDocument()
    expect(screen.queryByText('Description')).toBeInTheDocument()
  })

  it('should add custom classes to container div', () => {
    const className = 'custom classes'

    const { container } = render(
      <Alert title="Required Title" className={className}>
        Description
      </Alert>
    )
    const alert = container.querySelector('div')

    expect(alert?.className).toStrictEqual(expect.stringContaining(className))
  })

  it('should close alert when close button clicked', () => {
    render(
      <Alert title="Required Title" closable>
        Description
      </Alert>
    )

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(screen.queryByText('Description')).not.toBeInTheDocument()
  })

  describe('when withIcon is true', () => {
    describe("when variant is not 'neutral'", () => {
      it('should render an icon', () => {
        const { container } = render(
          <Alert title="Required Title" withIcon={true} variant="danger">
            Description
          </Alert>
        )

        expect(container.querySelector('svg')).toBeInTheDocument()
      })
    })

    describe("when variant is 'neutral'", () => {
      it('should not render an icon', () => {
        const { container } = render(
          <Alert title="Required Title" withIcon={true} variant="neutral">
            Description
          </Alert>
        )

        expect(container.querySelector('svg')).toBeNull()
      })
    })
  })

  describe('when withIcon is false', () => {
    it('should not render an icon', () => {
      const { container } = render(
        <Alert title="Required Title" withIcon={false} variant="danger">
          Description
        </Alert>
      )

      expect(container.querySelector('svg')).toBeNull()
    })
  })

  it.each(VARIANTS)('should have class %p from theme', (variant) => {
    const expected = defaultTheme.alert.variant[variant].base
    const { container } = render(
      <Alert title="Required Title" variant={variant}>
        Description
      </Alert>
    )
    const alert = container.querySelector('div')

    expect(alert?.className).toStrictEqual(expect.stringContaining(expected))
  })
})
