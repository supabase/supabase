import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

describe('metrics preview environment and project scope', () => {
  it.each(['local', 'staging'])(
    'applies overrides only to the selected project in %s',
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
    'rejects preview changes in %s',
    async (environment) => {
      vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', environment)
      const { getMemoryCommitmentPreview, setMemoryCommitmentPreview } =
        await import('./metrics-preview')

      setMemoryCommitmentPreview('project-a', 'severe')
      expect(getMemoryCommitmentPreview('project-a')).toBe('default')
    }
  )
})
