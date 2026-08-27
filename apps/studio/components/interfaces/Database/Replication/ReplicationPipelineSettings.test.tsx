import { fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineSettings } from './ReplicationPipelineSettings'
import { customRender } from '@/tests/lib/custom-render'

const setEdit = vi.hoisted(() => vi.fn())

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '42' }),
}))

vi.mock('nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('nuqs')>()),
  useQueryState: () => {
    const [value, setValue] = useState<number | null>(null)
    return [
      value,
      (nextValue: number | null) => {
        setEdit(nextValue)
        setValue(nextValue)
      },
    ]
  },
}))

vi.mock('./DestinationPanel/DestinationPanel', () => ({
  DestinationPanel: () => <div>Destination editor</div>,
}))

vi.mock('@/data/replication/pipeline-by-id-query', () => ({
  useReplicationPipelineByIdQuery: () => ({
    data: {
      id: 42,
      destination_id: 7,
      source_name: 'main-db',
      destination_name: 'Analytics warehouse',
      config: { publication_name: 'analytics_publication' },
    },
    isPending: false,
    isError: false,
  }),
}))

describe('ReplicationPipelineSettings', () => {
  test('shows configuration and opens the existing destination editor', () => {
    customRender(<ReplicationPipelineSettings />)

    expect(screen.getByText('Analytics warehouse')).toBeVisible()
    expect(screen.getByText('main-db')).toBeVisible()
    expect(screen.getByText('analytics_publication')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Edit destination' }))
    expect(setEdit).toHaveBeenCalledWith(7)
    expect(screen.getByText('Destination editor')).toBeVisible()
  })
})
