import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

describe('metrics preview environment and project scope', () => {
  it.each(['local', 'staging'])(
    'keeps one project’s simulated metrics from affecting another project in %s',
    async (environment) => {
      vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', environment)
      const { getMemoryCommitmentPreview, setMemoryCommitmentPreview } =
        await import('./metrics-preview')

      setMemoryCommitmentPreview('project-a', 'severe')
      expect(getMemoryCommitmentPreview('project-a')).toBe('severe')
      expect(getMemoryCommitmentPreview('project-b')).toBe('default')
      setMemoryCommitmentPreview('project-b', 'warn')
      setMemoryCommitmentPreview('project-a', 'default')
      expect(getMemoryCommitmentPreview('project-a')).toBe('default')
      expect(getMemoryCommitmentPreview('project-b')).toBe('warn')
      expect(getMemoryCommitmentPreview(undefined)).toBe('default')
    }
  )

  it.each(['prod', 'production', 'preview', 'test'])(
    'prevents simulated metrics from replacing real data in %s',
    async (environment) => {
      vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', environment)
      const { getMemoryCommitmentPreview, setMemoryCommitmentPreview } =
        await import('./metrics-preview')

      setMemoryCommitmentPreview('project-a', 'severe')
      expect(getMemoryCommitmentPreview('project-a')).toBe('default')
    }
  )
})
