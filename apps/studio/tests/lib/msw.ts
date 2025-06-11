import { setupServer } from 'msw/node'
import { GlobalAPIMocks } from './msw-global-api-mocks'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'lib/constants'

export const mswServer = setupServer(...GlobalAPIMocks)

export const addAPIMock = ({
  method,
  path,
  response,
}: {
  method: keyof typeof http
  path: string
  response: any
}) => {
  const fullPath = `${API_URL}${path}`
  console.log('[MSW] Adding mock:', method, fullPath)

  mswServer.use(
    http[method](fullPath, () => {
      return HttpResponse.json(response)
    })
  )
}
