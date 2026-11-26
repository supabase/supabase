import { createRootRoute, createRoute } from '@tanstack/react-router'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { consentState } from 'common/consent-state'
import { HttpResponse } from 'msw'
import { expect, it, onTestFinished } from 'vitest'

import { useStudioCommandMenuTelemetry } from '../useStudioCommandMenuTelemetry'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

function Probe() {
  const { onTelemetry } = useStudioCommandMenuTelemetry()
  return (
    <button
      tabIndex={0}
      onClick={() =>
        onTelemetry({
          action: 'command_menu_opened',
          properties: { trigger_type: 'keyboard_shortcut', app: 'studio' },
          groups: {},
        })
      }
    >
      Open
    </button>
  )
}

it('sends the framework route pattern as the pathname', async () => {
  const previousConsent = consentState.hasConsented
  consentState.hasConsented = true
  onTestFinished(() => {
    consentState.hasConsented = previousConsent
  })

  const telemetryRequests: unknown[] = []
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

  const route = createRoute({
    getParentRoute: () => createRootRoute(),
    path: '$id',
    component: Probe,
  })
  await renderRoute(route, { routeId: '/project/$ref/sql/$id', url: '/project/abc/sql/123' })

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
  })

  await waitFor(() => {
    expect(telemetryRequests).toMatchObject([
      {
        action: 'command_menu_opened',
        pathname: '/project/[ref]/sql/[id]',
        groups: { project: 'abc' },
      },
    ])
  })
})
