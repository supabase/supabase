import { createRootRoute, createRoute } from '@tanstack/react-router'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { useFramework } from 'common'
import { consentState } from 'common/consent-state'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, onTestFinished } from 'vitest'

import { useTrack } from './track'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

function Probe() {
  const track = useTrack()
  const { pathname } = useFramework()
  return (
    <>
      <output aria-label="framework pathname">{pathname}</output>
      <button tabIndex={0} onClick={() => track('help_button_clicked')}>
        Track
      </button>
    </>
  )
}

const createProbeRoute = (path: string) =>
  createRoute({ getParentRoute: () => createRootRoute(), path, component: Probe })

describe('useTrack', () => {
  let telemetryRequests: unknown[]

  beforeEach(() => {
    const previousConsent = consentState.hasConsented
    consentState.hasConsented = true
    onTestFinished(() => {
      consentState.hasConsented = previousConsent
    })

    telemetryRequests = []
    addAPIMock({
      method: 'post',
      path: '/platform/telemetry/event',
      response: async ({ request }) => {
        telemetryRequests.push(await request.json())
        return new HttpResponse(null, { status: 201 })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
    })
  })

  it.each([
    {
      name: 'a dynamic route',
      path: '$id',
      routeId: '/project/$ref/sql/$id',
      url: '/project/abc/sql/123',
      expected: '/project/[ref]/sql/[id]',
    },
    {
      name: 'an index route',
      path: '/',
      routeId: '/project/$ref/',
      url: '/project/abc',
      expected: '/project/[ref]',
    },
  ])(
    'sends the framework route pattern as the pathname on $name',
    async ({ path, routeId, url, expected }) => {
      await renderRoute(createProbeRoute(path), { routeId, url })

      expect(screen.getByLabelText('framework pathname')).toHaveTextContent(expected)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Track' }))
      })

      await waitFor(() => {
        expect(telemetryRequests).toMatchObject([
          { action: 'help_button_clicked', pathname: expected },
        ])
      })
    }
  )
})
