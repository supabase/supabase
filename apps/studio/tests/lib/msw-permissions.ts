import { HttpResponse } from 'msw'

import { addAPIMock, type APIErrorBody } from './msw'
import type { PermissionsV2Response } from './permissions-fixtures'

/**
 * Mocks the current user's FGA permissions. Use `allPermissionsFor([slug])` to grant everything,
 * `NO_PERMISSIONS` to deny every check, or a hand-built response for specific permissions.
 */
export function mockPermissions(response: PermissionsV2Response) {
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions/v2',
    response: () => HttpResponse.json<PermissionsV2Response>(response),
  })
}

/** Makes the permissions request fail, so grants resolve to an error. */
export function mockPermissionsError({
  status = 500,
  message = 'Failed to retrieve permissions',
}: { status?: number; message?: string } = {}) {
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions/v2',
    response: () => HttpResponse.json<APIErrorBody>({ message }, { status }),
  })
}
