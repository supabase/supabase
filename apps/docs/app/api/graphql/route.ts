import * as Sentry from '@sentry/nextjs'
import {
  getOperationAST,
  graphql,
  GraphQLError,
  parse,
  specifiedRules,
  validate,
  type DocumentNode,
} from 'graphql'
import { createComplexityLimitRule } from 'graphql-validation-complexity'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, convertZodToInvalidRequestError, InvalidRequestError } from '~/app/api/utils'
import { BASE_PATH, IS_DEV } from '~/lib/constants'
import { LOGGING_CODES, sendToLogflare } from '~/lib/logger'
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    }
  }

  return {}
}

function getCacheHeaders(): Record<string, string> {
  return {
    /**
     * Cache on CDN for 1 hour
     * Serve stale content while revalidating for 5 minutes
     */
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
  }
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
type GraphQLRequestPayload = z.infer<typeof graphQLRequestSchema>

async function handleGraphQLRequest(request: Request): Promise<NextResponse> {
  const { method } = request
  const isGetRequest = method === 'GET'

  const { query, variables, operationName } = await parseGraphQLRequestPayload(request)
  const validationErrors = validateGraphQLRequest(query, {
    isDevGraphiQL: isDevGraphiQL(request),
    isGetRequest,
    operationName,
  })
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
        headers: getResponseHeaders(request, isGetRequest),
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
    headers: getResponseHeaders(request, isGetRequest),
  })
}

function getResponseHeaders(request: Request, isGetRequest: boolean): Record<string, string> {
  const headers = {
    ...getCorsHeaders(request),
  }

  if (isGetRequest) {
    Object.assign(headers, getCacheHeaders())
  }

  return headers
}

async function parseGraphQLRequestPayload(request: Request): Promise<GraphQLRequestPayload> {
  if (request.method === 'GET') {
    return parseGraphQLGetRequest(request)
  }

  return parseGraphQLJsonBody(request)
}

async function parseGraphQLJsonBody(request: Request): Promise<GraphQLRequestPayload> {
  const body = await request.json().catch((error) => {
    throw new InvalidRequestError('Request body must be valid JSON', error)
  })
  const parsedBody = graphQLRequestSchema.safeParse(body)
  if (!parsedBody.success) {
    throw convertZodToInvalidRequestError(
      parsedBody.error,
      'GraphQL request payload must be valid GraphQL request object'
    )
  }

  return parsedBody.data
}

function parseGraphQLGetRequest(request: Request): GraphQLRequestPayload {
  const url = new URL(request.url)
  const query = url.searchParams.get('query')
  const operationName = url.searchParams.get('operationName') ?? undefined

  const variablesParam = url.searchParams.get('variables')
  let variables: GraphQLRequestPayload['variables'] = undefined
  if (variablesParam !== null) {
    try {
      variables = JSON.parse(variablesParam)
    } catch (error) {
      throw new InvalidRequestError('Variables query parameter must be valid JSON', error)
    }
  }

  const parsedBody = graphQLRequestSchema.safeParse({
    query,
    variables,
    operationName,
  })
  if (!parsedBody.success) {
    throw convertZodToInvalidRequestError(
      parsedBody.error,
      'GraphQL request payload must be valid GraphQL request object'
    )
  }

  return parsedBody.data
}

function validateGraphQLRequest(
  query: string,
  options?: {
    isDevGraphiQL?: boolean
    isGetRequest?: boolean
    operationName?: string
  }
): ReadonlyArray<GraphQLError> {
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
  const rules = options?.isDevGraphiQL ? specifiedRules : validationRules
  const validationErrors = validate(rootGraphQLSchema, documentAST, rules)
  if (!options?.isGetRequest) {
    return validationErrors
  }

  const operationAST = getOperationAST(documentAST, options.operationName)
  if (!operationAST) {
    return [
      ...validationErrors,
      new GraphQLError(
        'GET requests must specify an operation name or send only a single operation'
      ),
    ]
  }
  if (operationAST.operation !== 'query') {
    return [...validationErrors, new GraphQLError('GET requests may only execute query operations')]
  }

  return validationErrors
}

async function handleRequest(request: Request): Promise<NextResponse> {
  try {
    const method = request.method
    const vercelId = request.headers.get('x-vercel-id')
    sendToLogflare(LOGGING_CODES.CONTENT_API_REQUEST_RECEIVED, {
      vercelId,
      method,
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

export async function OPTIONS(request: Request): Promise<NextResponse> {
  const corsHeaders = getCorsHeaders(request)
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleRequest(request)
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleRequest(request)
}
