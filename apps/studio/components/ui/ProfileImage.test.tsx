import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProfileImage } from './ProfileImage'

vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: ComponentProps<'img'>) => (
    <img alt={alt} src={src} {...props} />
  ),
}))

describe('ProfileImage', () => {
  it('renders an image for a string src', () => {
    render(<ProfileImage alt="Profile" src="https://avatars.githubusercontent.com/u/1" />)

    expect(screen.getByRole('img', { name: 'Profile' })).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/1'
    )
  })

  it('falls back when src is not a string at runtime', () => {
    const invalidSrc = { url: 'https://avatars.githubusercontent.com/u/1' }

    const { container } = render(
      <ProfileImage
        alt="Profile"
        src={invalidSrc as unknown as string}
        placeholder={<span data-testid="fallback-avatar" />}
      />
    )

    expect(screen.getByTestId('fallback-avatar')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
