import { type NextRequest } from 'next/server'

import { _handleRevalidateRequest } from './route.utils'

export const POST = handleError(_handleRevalidateRequest)

function handleError(handleRequest: (request: NextRequest) => Promise<Response>) {
  return async function (request: NextRequest) {
    try {
      const response = await handleRequest(request)
      return response
    } catch (error) {
      console.error(error)
      return new Response('Internal server error', { status: 500 })
    }
  }
}
