import _routerMock from 'next-router-mock'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'

export const routerMock = _routerMock

routerMock.useParser(
  createDynamicRouteParser([
    // These paths should match those found in the `/pages` folder:
    '/projects/[ref]',
  ])
)
