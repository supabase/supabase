import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { OverRoleAnnotation } from './OverRoleAnnotation'
import { customRender } from '@/tests/lib/custom-render'

describe('OverRoleAnnotation', () => {
  test('renders when the requested level exceeds the role', () => {
    customRender(<OverRoleAnnotation level="write" memberRole="Read-only" />)
    expect(screen.getByText('Read-only for your role')).toBeInTheDocument()
  })

  test('renders nothing when the role covers the requested level', () => {
    customRender(<OverRoleAnnotation level="read" memberRole="Read-only" />)
    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
  })

  test('renders nothing for a role that can write', () => {
    customRender(<OverRoleAnnotation level="read_write" memberRole="Developer" />)
    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
  })
})
