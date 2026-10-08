import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

import { FeaturePreviewContextProvider, usePipelineCreationPreview } from './FeaturePreviewContext'

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

const rollout = vi.hoisted(() => ({ enabled: false }))
vi.mock('common', async (importOriginal) => {
  const common = await importOriginal<typeof import('common')>()
  const { createContext } = await import('react')
  return {
    ...common,
    FeatureFlagContext: createContext({ hasLoaded: true }),
    LOCAL_STORAGE_KEYS: {
      ...common.LOCAL_STORAGE_KEYS,
      UI_PREVIEW_PIPELINE_CREATION: 'supabase-ui-pipeline-creation',
    },
    useFlag: (key: string) => key === 'pipelineCreationPreview' && rollout.enabled,
  }
})

beforeEach(() => localStorage.clear())

test.each([
  [false, false, false],
  [false, true, false],
  [true, false, false],
  [true, true, true],
])('rollout %s and opt-in %s enable the preview: %s', async (available, optedIn, expected) => {
  rollout.enabled = available
  localStorage.setItem('supabase-ui-pipeline-creation', String(optedIn))
  const { result } = renderHook(usePipelineCreationPreview, {
    wrapper: FeaturePreviewContextProvider,
  })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.isEnabled).toBe(expected)
})
