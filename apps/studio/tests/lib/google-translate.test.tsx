import { act, Component, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, test } from 'vitest'

type Operation = 'removeChild' | 'insertBefore'
type ContainerTag = 'div' | 'span'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? <p>Render failed</p> : this.props.children
  }
}

function TranslationFixture({
  operation,
  hasTextWrapper,
  containerTag: Container,
}: {
  operation: Operation
  hasTextWrapper: boolean
  containerTag: ContainerTag
}) {
  const [isShown, setIsShown] = useState(operation === 'removeChild')

  return (
    <>
      <button tabIndex={0} onClick={() => setIsShown(!isShown)}>
        Toggle
      </button>
      <Container data-testid="subject">
        {operation === 'removeChild' &&
          (hasTextWrapper ? isShown && <span>Hello</span> : isShown && 'Hello')}
        {operation === 'insertBefore' && isShown && <strong>Added</strong>}
        {operation === 'insertBefore' && (hasTextWrapper ? <span>Hello</span> : 'Hello')}
        <em>Retained sibling</em>
      </Container>
    </>
  )
}

const mutations = [
  {
    name: 'replaces text with nested translation elements',
    mutate(text: Text) {
      const outer = document.createElement('font')
      const inner = document.createElement('font')
      inner.textContent = 'Hola'
      outer.appendChild(inner)
      text.replaceWith(outer)
    },
    remainingText: 'Hola',
  },
  {
    name: 'removes the original text node',
    mutate(text: Text) {
      text.remove()
    },
    remainingText: '',
  },
]

let root: Root | undefined
let container: HTMLDivElement | undefined

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = undefined
  container = undefined
})

function renderFixture(operation: Operation, hasTextWrapper: boolean, containerTag: ContainerTag) {
  const errors: unknown[] = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container, { onCaughtError: (error) => errors.push(error) })

  act(() => {
    root?.render(
      <ErrorBoundary>
        <TranslationFixture
          operation={operation}
          hasTextWrapper={hasTextWrapper}
          containerTag={containerTag}
        />
      </ErrorBoundary>
    )
  })

  const subject = container.querySelector('[data-testid="subject"]')
  const button = container.querySelector('button')
  const sibling = subject?.querySelector('em')
  if (!subject || !button || !sibling) throw new Error('Fixture did not render')

  const text = document.createTreeWalker(subject, NodeFilter.SHOW_TEXT).nextNode()
  if (!(text instanceof Text) || text.textContent !== 'Hello') {
    throw new Error('Fixture did not render the original text node')
  }

  return {
    errors,
    subject,
    sibling,
    text,
    toggle: () => act(() => button.click()),
  }
}

describe.each(mutations)('when translation $name', ({ mutate, remainingText }) => {
  test.each([
    { operation: 'removeChild', containerTag: 'div' },
    { operation: 'insertBefore', containerTag: 'div' },
    { operation: 'removeChild', containerTag: 'span' },
    { operation: 'insertBefore', containerTag: 'span' },
  ] as const)(
    '$operation throws NotFoundError for unwrapped text inside a $containerTag',
    ({ operation, containerTag }) => {
      const fixture = renderFixture(operation, false, containerTag)
      mutate(fixture.text)
      expect(fixture.text.isConnected).toBe(false)

      fixture.toggle()

      expect(fixture.errors).toHaveLength(1)
      expect(fixture.errors[0]).toBeInstanceOf(DOMException)
      expect(fixture.errors[0]).toMatchObject({
        name: 'NotFoundError',
        message:
          operation === 'removeChild'
            ? 'The node to be removed is not a child of this node.'
            : 'The child can not be found in the parent.',
      })
      expect(container).toHaveTextContent('Render failed')
    }
  )

  test.each(['removeChild', 'insertBefore'] as const)(
    '%s succeeds when each text leaf has its own span',
    (operation) => {
      const fixture = renderFixture(operation, true, 'div')
      mutate(fixture.text)
      expect(fixture.text.isConnected).toBe(false)

      fixture.toggle()

      expect(fixture.errors).toEqual([])
      expect(fixture.subject.querySelector('em')).toBe(fixture.sibling)
      expect(fixture.sibling).toBeVisible()
      expect(fixture.subject).toHaveTextContent(
        operation === 'removeChild' ? 'Retained sibling' : `Added${remainingText}Retained sibling`
      )
      expect(fixture.subject.querySelector('strong')?.textContent ?? '').toBe(
        operation === 'insertBefore' ? 'Added' : ''
      )
    }
  )
})
