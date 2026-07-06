import { screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { customRender as render } from '@/tests/lib/custom-render'

vi.mock('@/components/interfaces/ProjectHome/Home', () => ({
  ProjectHome: () => <div data-testid="project-home" />,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layouts/ProjectLayout', () => ({
  ProjectLayoutWithAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/gotrue', () => ({
  auth: { onAuthStateChange: vi.fn() },
}))

describe('project home page', () => {
  test('renders ProjectHome', async () => {
    const { default: HomePage } = await import('@/pages/project/[ref]/index')
    render(<HomePage dehydratedState={undefined} />)
    expect(screen.getByTestId('project-home')).toBeInTheDocument()
  })
})
