import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UserCard } from './UserCard'

describe('UserCard', () => {
  it('shows one email label for a whitespace-only display name', () => {
    render(
      <UserCard
        user={{
          id: 'user-1',
          email: 'ada@example.com',
          providers: ['email'],
          raw_user_meta_data: { name: '  ' },
        }}
      />
    )

    expect(screen.getAllByText('ada@example.com')).toHaveLength(1)
    expect(screen.queryByTitle('  ')).not.toBeInTheDocument()
  })
})
