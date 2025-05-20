import * as Sentry from '@sentry/nextjs'
import { type DocumentNode, graphql, GraphQLError, parse, specifiedRules, validate } from 'graphql'
import { createComplexityLimitRule } from 'graphql-validation-complexity'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, convertZodToInvalidRequestError, InvalidRequestError } from '~/app/api/utils'
import { BASE_PATH, IS_DEV } from '~/lib/constants'
import { rootGraphQLSchema } from '~/resources/rootSchema'
import { createQueryDepthLimiter } from './validators'

export const runtime = 'edge'

const MAX_DEPTH = 5

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
    return NextResponse.json({
      errors: validationErrors.map((error) => ({
        message: error.message,
        locations: error.locations,
        path: error.path,
      })),
    })
  }

  const result = await graphql({
    schema: rootGraphQLSchema,
    contextValue: { request },
    source: query,
    variableValues: variables,
    operationName,
  })
  return NextResponse.json(result)
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    return await handleGraphQLRequest(request)
  } catch (error: unknown) {
    console.error(error)

    if (error instanceof ApiError) {
      if (!error.isUserError()) {
        Sentry.captureException(error)
      }

      return NextResponse.json({
        errors: [{ message: error.isPrivate() ? 'Internal Server Error' : error.message }],
      })
    } else {
      Sentry.captureException(error)

      return NextResponse.json({
        errors: [{ message: 'Internal Server Error' }],
      })
    }
  }
}
