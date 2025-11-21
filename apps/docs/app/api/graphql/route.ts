import * as Sentry from '@sentry/nextjs'
import { type DocumentNode, graphql, GraphQLError, parse, specifiedRules, validate } from 'graphql'
import { createComplexityLimitRule } from 'graphql-validation-complexity'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, convertZodToInvalidRequestError, InvalidRequestError } from '~/app/api/utils'
import { BASE_PATH, IS_DEV } from '~/lib/constants'
import { sendToLogflare, LOGGING_CODES } from '~/lib/logger'
import { rootGraphQLSchema } from '~/resources/rootSchema'
import { createQueryDepthLimiter } from './validators'

export const runtime = 'edge'
/* To avoid OpenAI errors, restrict to the Vercel Edge Function regions that
  overlap with the OpenAI API regions.

  Reference for Vercel regions: https://vercel.com/docs/edge-network/regions#region-list
  Reference for OpenAI regions: https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories
  */
export const preferredRegion = [
  'arn1',
  'bom1',
  'cdg1',
  'cle1',
  'cpt1',
  'dub1',
  'fra1',
  'gru1',
  'hnd1',
  'iad1',
  'icn1',
  'kix1',
  'lhr1',
  'pdx1',
  'sfo1',
  'sin1',
  'syd1',
]

const MAX_DEPTH = 5

function isAllowedCorsOrigin(origin: string): boolean {
  const exactMatches = IS_DEV
    ? ['http://localhost:8082', 'https://supabase.com']
    : ['https://supabase.com']
  if (exactMatches.includes(origin)) {
    return true
  }

  return /^https:\/\/[\w-]+\w-supabase.vercel.app$/.test(origin)
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin')

  if (origin && isAllowedCorsOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    }
  }

  return {}
}

const validationRules = [
  ...specifiedRules,
  createQueryDepthLimiter(MAX_DEPTH),
  createComplexityLimitRule(1500, {
    scalarCost: 1,
    objectCost: 2,
    listFactor: 10,
  }),
]

function isDevGraphiQL(request: Request) {
  const origin = request.headers.get('Origin')
  const referrer = request.headers.get('Referer')
  return (
    IS_DEV &&
    origin?.startsWith('http://localhost') &&
    referrer === `${origin}${BASE_PATH ?? ''}/graphiql`
  )
}

const graphQLRequestSchema = z.object({
  query: z.string(),
  variables: z.record(z.any()).optional(),
  operationName: z.string().optional(),
})

async function handleGraphQLRequest(request: Request): Promise<NextResponse> {
  const body = await request.json().catch((error) => {
    throw new InvalidRequestError('Request body must be valid JSON', error)
  })
  const parsedBody = graphQLRequestSchema.safeParse(body)
  if (!parsedBody.success) {
    throw convertZodToInvalidRequestError(
      parsedBody.error,
      'Request body must be valid GraphQL request object'
    )
  }

  const { query, variables, operationName } = parsedBody.data
  const validationErrors = validateGraphQLRequest(query, isDevGraphiQL(request))
  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        errors: validationErrors.map((error) => ({
          message: error.message,
          locations: error.locations,
          path: error.path,
        })),
      },
      {
        headers: getCorsHeaders(request),
      }
    )
  }

  const result = await graphql({
    schema: rootGraphQLSchema,
    contextValue: { request },
    source: query,
    variableValues: variables,
    operationName,
  })
  return NextResponse.json(result, {
    headers: getCorsHeaders(request),
  })
}

function validateGraphQLRequest(query: string, isDevGraphiQL = false): ReadonlyArray<GraphQLError> {
  let documentAST: DocumentNode
  try {
    documentAST = parse(query)
  } catch (error: unknown) {
    if (error instanceof GraphQLError) {
      return [error]
    } else {
      throw error
    }
  }
  const rules = isDevGraphiQL ? specifiedRules : validationRules
  return validate(rootGraphQLSchema, documentAST, rules)
}

export async function OPTIONS(request: Request): Promise<NextResponse> {
  const corsHeaders = getCorsHeaders(request)
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const vercelId = request.headers.get('x-vercel-id')
    sendToLogflare(LOGGING_CODES.CONTENT_API_REQUEST_RECEIVED, {
      vercelId,
      origin: request.headers.get('Origin'),
      userAgent: request.headers.get('User-Agent'),
    })

    const result = await handleGraphQLRequest(request)
    // Do not let Vercel close the process until Sentry has flushed
    // https://github.com/getsentry/sentry-javascript/issues/9626
    await Sentry.flush(2000)
    return result
  } catch (error: unknown) {
    console.error(error)

    if (error instanceof ApiError) {
      if (!error.isUserError()) {
        Sentry.captureException(error)
      }
      // Do not let Vercel close the process until Sentry has flushed
      // https://github.com/getsentry/sentry-javascript/issues/9626
      await Sentry.flush(2000)

      return NextResponse.json(
        {
          errors: [{ message: error.isPrivate() ? 'Internal Server Error' : error.message }],
        },
        {
          headers: getCorsHeaders(request),
        }
      )
    } else {
      Sentry.captureException(error)
      // Do not let Vercel close the process until Sentry has flushed
      // https://github.com/getsentry/sentry-javascript/issues/9626
      await Sentry.flush(2000)

      return NextResponse.json(
        {
          errors: [{ message: 'Internal Server Error' }],
        },
        {
          headers: getCorsHeaders(request),
        }
      )
    }
  }
}
