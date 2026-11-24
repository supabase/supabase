import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { consentState } from 'common'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, onTestFinished } from 'vitest'

import { NewTab } from './NewTab'
import { TableEditorStateContextProvider } from '@/state/table-editor'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

describe('NewTab', () => {
  const telemetryRequests: unknown[] = []

  beforeEach(() => {
    telemetryRequests.length = 0
    routerMock.setCurrentUrl('/project/default/editor/new')

    const previousConsent = consentState.hasConsented
    consentState.hasConsented = true
    onTestFinished(() => {
      consentState.hasConsented = previousConsent
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project response for useSelectedProjectQuery
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })

    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<unknown[]>([]),
    })

    addAPIMock({
      method: 'post',
      path: '/platform/telemetry/event',
      response: async ({ request }) => {
        telemetryRequests.push(await request.json())
        return HttpResponse.json<Record<string, never>>({}, { status: 201 })
      },
    })
  })

  it('tracks table_editor_new_item_clicked with trigger new_tab_card when clicking Create a table', async () => {
    const user = userEvent.setup()

    customRender(
      <TableEditorStateContextProvider>
        <NewTab />
      </TableEditorStateContextProvider>
    )

    await user.click(await screen.findByText('Create a table'))

    await waitFor(() => {
      expect(telemetryRequests).toMatchObject([
        {
          action: 'table_editor_new_item_clicked',
          custom_properties: {
            itemType: 'table',
            trigger: 'new_tab_card',
          },
        },
      ])
    })
  })
})
