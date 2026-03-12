import { screen } from '@testing-library/react'
import { customRender as render } from 'tests/lib/custom-render'
import { beforeAll, describe, expect, test, vi } from 'vitest'

vi.mock('components/interfaces/Home/Home', () => ({
  Home: () => <div data-testid="old-home" />,
}))

vi.mock('components/interfaces/ProjectHome/Home', () => ({
  ProjectHome: () => <div data-testid="project-home" />,
}))

vi.mock('components/layouts/DefaultLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/layouts/ProjectLayout', () => ({
  ProjectLayoutWithAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('lib/gotrue', () => ({
  auth: { onAuthStateChange: vi.fn() },
}))

describe('when IS_PLATFORM is true', () => {
  beforeAll(() => {
    vi.doMock('common', async (importOriginal: () => Promise<any>) => {
      const mod = await importOriginal()
      return { ...mod, IS_PLATFORM: true }
    })
  })

  test('renders ProjectHome', async () => {
    const { default: HomePage } = await import('pages/project/[ref]/index')
    render(<HomePage dehydratedState={undefined} />)
    expect(screen.getByTestId('project-home')).toBeInTheDocument()
    expect(screen.queryByTestId('old-home')).not.toBeInTheDocument()
  })
})

describe('when IS_PLATFORM is false', () => {
  beforeAll(() => {
    vi.resetModules()
    vi.doMock('common', async (importOriginal: () => Promise<any>) => {
      const mod = await importOriginal()
      return { ...mod, IS_PLATFORM: false }
    })
  })

  test('renders Home', async () => {
    const { default: HomePage } = await import('pages/project/[ref]/index')
    render(<HomePage dehydratedState={undefined} />)
    expect(screen.getByTestId('old-home')).toBeInTheDocument()
    expect(screen.queryByTestId('project-home')).not.toBeInTheDocument()
  })
})
