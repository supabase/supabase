import ResourceContent, { ResourceContentProps } from 'components/interfaces/Docs/ResourceContent'
import { render } from 'tests/helpers'
import { screen } from '@testing-library/react'

describe('ResourceContent', () => {
  const defaultResourceId = 'foo'

  const buildProps = (overrides?: Partial<ResourceContentProps>): ResourceContentProps => {
    const resourceId = overrides?.resourceId ?? defaultResourceId
    return {
      autoApiService: {},
      resourceId,
      resources: {},
      definitions: {
        [resourceId]: {
          description: 'bar',
        },
      },
      paths: {
        [`/${resourceId}`]: {},
      },
      selectedLang: 'js',
      apiKey: '4e06c649-fe79-514e-95dd-81aff148c258',
      refreshDocs: () => {},
      ...overrides,
    }
  }

  it.each([undefined, null])('should not render when paths is %p', (paths: undefined | null) => {
    const props = buildProps({ paths })

    const { container } = render(<ResourceContent {...props} />)

    expect(container).toBeEmptyDOMElement()
  })

  it.each([undefined, null, ''])(
    'should not render when resourceId is %p',
    (resourceId: undefined | null | string) => {
      const props = buildProps({ resourceId: resourceId as string | undefined })

      const { container } = render(<ResourceContent {...props} />)

      expect(container).toBeEmptyDOMElement()
    }
  )

  it.each([undefined, null])(
    'should not render when definitions is is %p',
    (definitions: undefined | null) => {
      const props = buildProps({ definitions })

      const { container } = render(<ResourceContent {...props} />)

      expect(container).toBeEmptyDOMElement()
    }
  )

  it.each([undefined, null])("should not throw when 'definitions.resourceId' is %p", () => {
    const props = buildProps({ definitions: {} })

    expect(() => render(<ResourceContent {...props} />)).not.toThrow()
  })

  it('should render', () => {
    const props = buildProps()

    render(<ResourceContent {...props} />)

    expect(() => screen.getByText('Description')).not.toThrow()
  })
})
