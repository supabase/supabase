import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks (hoisted before all imports)
// ---------------------------------------------------------------------------

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
}))

vi.mock('@/lib/api/self-hosted/projects', () => ({
  getProjects: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Tests for pages/index.tsx — getServerSideProps
// ---------------------------------------------------------------------------

describe('pages/index getServerSideProps', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('redirects to the first project ref from getProjects()', async () => {
    const { getProjects } = await import('@/lib/api/self-hosted/projects')
    vi.mocked(getProjects).mockReturnValue([
      { ref: 'moonlit' } as any,
      { ref: 'other' } as any,
    ])

    const { getServerSideProps } = await import('@/pages/index')
    const result = await getServerSideProps({} as any)

    expect(result).toEqual({
      redirect: { destination: '/project/moonlit', permanent: false },
    })
  })

  it('falls back to /project/default when getProjects() returns empty array', async () => {
    const { getProjects } = await import('@/lib/api/self-hosted/projects')
    vi.mocked(getProjects).mockReturnValue([])

    const { getServerSideProps } = await import('@/pages/index')
    const result = await getServerSideProps({} as any)

    expect(result).toEqual({
      redirect: { destination: '/project/default', permanent: false },
    })
  })

  it('falls back to /project/default when getProjects() throws', async () => {
    const { getProjects } = await import('@/lib/api/self-hosted/projects')
    vi.mocked(getProjects).mockImplementation(() => {
      throw new Error('registry unavailable')
    })

    const { getServerSideProps } = await import('@/pages/index')
    const result = await getServerSideProps({} as any)

    expect(result).toEqual({
      redirect: { destination: '/project/default', permanent: false },
    })
  })

  it('redirects to /org when IS_PLATFORM is true', async () => {
    vi.doMock('@/lib/constants', () => ({ IS_PLATFORM: true }))

    const { getServerSideProps } = await import('@/pages/index')
    const result = await getServerSideProps({} as any)

    expect(result).toEqual({
      redirect: { destination: '/org', permanent: false },
    })
  })
})
