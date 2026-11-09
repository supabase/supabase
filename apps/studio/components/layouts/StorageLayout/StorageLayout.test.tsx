import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import StorageLayout from './StorageLayout'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('../ProjectLayout', () => ({
  ProjectLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const renderStorageLayout = (disabledFeatures: string[]) => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), {
    disabled_features: disabledFeatures,
  })
  customRender(<StorageLayout title="Files">Storage page</StorageLayout>, { queryClient })
}

describe('StorageLayout', () => {
  it('shows the unknown page when storage is disabled', () => {
    renderStorageLayout(['project_storage:all'])
    expect(screen.getByText('Looking for something?')).toBeInTheDocument()
    expect(screen.queryByText('Storage page')).not.toBeInTheDocument()
  })

  it('shows the storage page when storage is enabled', () => {
    renderStorageLayout([])
    expect(screen.getByText('Storage page')).toBeInTheDocument()
  })
})
