// import { graphql } from 'graphql'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { ApiError, InvalidRequestError } from '~/app/api/utils'

export const runtime = 'edge'

const graphQLRequestSchema = z.object({
  query: z.string(),
  variables: z.record(z.any()).optional(),
  operationName: z.string().optional(),
})

async function handleGraphQLRequest(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => {
    throw new InvalidRequestError('Request body must be valid JSON')
  })
  const parsedBody = graphQLRequestSchema.safeParse(body)
  if (!parsedBody.success) {
    const errorMessage = parsedBody.error?.message
    throw new InvalidRequestError(
      `Request body must be a valid GraphQL request object${errorMessage ? `: ${errorMessage}` : ''}`
    )
  }

  // const { query, variables, operationName } = parsedBody.data
  // When endpoint is complete, this should return a response with the GraphQL
  // query result

  // For now, just return a 404 response
  return new NextResponse('Not Found', { status: 404 })
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    return await handleGraphQLRequest(request)
  } catch (error: unknown) {
    console.error(error)

    if (error instanceof ApiError) {
      return new NextResponse(error.isPrivate() ? 'Internal Server Error' : error.message, {
        status: error.statusCode(),
      })
    } else {
      return new NextResponse('Internal Server Error', { status: 500 })
    }
  }
}
