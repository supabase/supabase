import { render, screen, fireEvent } from '@testing-library/react'
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import TableOfContents from './table-of-contents'

describe('TableOfContents', () => {
  const mockItems = [
    { id: 'section1', title: 'Section 1', level: 2 },
    { id: 'section2', title: 'Section 2', level: 2 },
  ]

  beforeEach(() => {
    // Mock scrollTo
    window.scrollTo = vi.fn()

    // Create mock elements
    mockItems.forEach((item) => {
      const element = document.createElement('div')
      element.id = item.id
      document.body.appendChild(element)
    })
  })

  afterEach(() => {
    // Clean up mock elements
    mockItems.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        element.remove()
      }
    })
  })

  it('renders all items', () => {
    render(<TableOfContents items={mockItems} />)

    mockItems.forEach((item) => {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    })
  })

  it('scrolls to section when item is clicked', () => {
    render(<TableOfContents items={mockItems} />)

    fireEvent.click(screen.getByText('Section 1'))

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'smooth',
    })
  })
})
