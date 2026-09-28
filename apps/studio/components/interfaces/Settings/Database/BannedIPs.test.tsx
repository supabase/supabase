import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'

import { BannedIPs } from './BannedIPs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  IS_PLATFORM: true,
  useParams: () => ({ ref: 'default' }),
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

test('shows a project-details error instead of leaving Network bans loading', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<APIErrorBody>({ message: 'Project unavailable' }, { status: 500 }),
  })

  customRender(<BannedIPs />)

  expect(await screen.findByText('Failed to retrieve project details')).toBeVisible()
  expect(screen.getByText('Error: Project unavailable')).toBeVisible()
  expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute(
    'href',
    expect.stringContaining('projectRef=default')
  )
  expect(screen.queryByRole('button', { name: 'Unban IP' })).not.toBeInTheDocument()
  expect(
    screen.queryByText('There are no banned IP addresses for your project')
  ).not.toBeInTheDocument()
})
