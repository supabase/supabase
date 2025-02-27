import { render, screen } from '@testing-library/react'
import Link from 'next/link'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { NavMenu, NavMenuItem } from './index'

describe('NavMenu Component', () => {
  it('renders without crashing', () => {
    render(<NavMenu />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const className = 'test-class'
    render(<NavMenu className={className} />)
    expect(screen.getByRole('navigation')).toHaveClass(className)
  })

  it('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()

    render(<NavMenu ref={ref}>test</NavMenu>)
    expect(ref.current).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <NavMenu>
        <NavMenuItem active={false}>
          <Link href="/">Home</Link>
        </NavMenuItem>
      </NavMenu>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
