import { describe, expect, it } from 'vitest'
import { supabase } from '~/lib/supabase'
import { POST } from '../route'

describe('/api/graphql errors collection', () => {
  it('returns a list of errors with pagination info', async () => {
    // Get the expected order of errors from the database
    const { data: dbErrors } = await supabase()
      .schema('content')
      .from('error')
      .select('id, code, ...service(service:name), httpStatusCode:http_status_code, message')
      .is('deleted_at', null)
      .order('id', { ascending: true })

    const errorsQuery = `
      query {
        errors(first: 2) {
          totalCount
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            cursor
            node {
              code
              service
              httpStatusCode
              message
            }
          }
          nodes {
            code
            service
            httpStatusCode
            message
          }
        }
      }
    `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: errorsQuery }),
    })

    const result = await POST(request)
    const {
      data: { errors },
      errors: queryErrors,
    } = await result.json()

    expect(queryErrors).toBeUndefined()
    expect(errors.totalCount).toBe(3)
    expect(errors.edges).toHaveLength(2)
    expect(errors.nodes).toHaveLength(2)
    expect(errors.pageInfo.hasNextPage).toBe(true)
    expect(errors.pageInfo.hasPreviousPage).toBe(false)
    expect(errors.pageInfo.startCursor).toBeDefined()
    expect(errors.pageInfo.endCursor).toBeDefined()

    // Compare against the first error from the database
    expect(dbErrors).not.toBe(null)
    const firstDbError = dbErrors![0]
    const firstError = errors.nodes[0]
    expect(firstError.code).toBe(firstDbError.code)
    expect(firstError.service).toBe(firstDbError.service)
    expect(firstError.httpStatusCode).toBe(firstDbError.httpStatusCode)
    expect(firstError.message).toBe(firstDbError.message)

    const firstEdge = errors.edges[0]
    expect(firstEdge.cursor).toBeDefined()
    expect(firstEdge.node).toEqual(firstError)
  })

  it('supports cursor-based pagination', async () => {
    const firstPageQuery = `
      query {
        errors(first: 1) {
          edges {
            cursor
            node {
              code
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `
    const firstRequest = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: firstPageQuery }),
    })

    const firstResult = await POST(firstRequest)
    const firstJson = await firstResult.json()
    expect(firstJson.errors).toBeUndefined()
    expect(firstJson.data.errors.edges).toHaveLength(1)
    expect(firstJson.data.errors.pageInfo.hasNextPage).toBe(true)
    expect(firstJson.data.errors.pageInfo.hasPreviousPage).toBe(false)

    const firstCursor = firstJson.data.errors.edges[0].cursor

    const secondPageQuery = `
      query {
        errors(first: 1, after: "${firstCursor}") {
          edges {
            cursor
            node {
              code
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `
    const secondRequest = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: secondPageQuery }),
    })

    const secondResult = await POST(secondRequest)
    const secondJson = await secondResult.json()
    expect(secondJson.errors).toBeUndefined()
    expect(secondJson.data.errors.edges).toHaveLength(1)
    expect(secondJson.data.errors.pageInfo.hasPreviousPage).toBe(true)

    expect(firstJson.data.errors.edges[0].node.code).not.toBe(
      secondJson.data.errors.edges[0].node.code
    )
  })

  it('returns empty list when paginating past available results', async () => {
    const query = `
      query {
        errors(first: 1, after: "ffffffff-ffff-ffff-ffff-ffffffffffff") {
          edges {
            cursor
            node {
              code
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })

    const result = await POST(request)
    const json = await result.json()
    expect(json.errors).toBeUndefined()
    expect(json.data.errors.edges).toHaveLength(0)
    expect(json.data.errors.pageInfo.hasNextPage).toBe(false)
    expect(json.data.errors.pageInfo.hasPreviousPage).toBe(true)
  })

  it('supports backward pagination with last', async () => {
    const lastPageQuery = `
      query {
        errors(last: 1) {
          edges {
            cursor
            node {
              code
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `
    const lastRequest = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: lastPageQuery }),
    })

    const lastResult = await POST(lastRequest)
    const lastJson = await lastResult.json()
    expect(lastJson.errors).toBeUndefined()
    expect(lastJson.data.errors.edges).toHaveLength(1)
    expect(lastJson.data.errors.pageInfo.hasNextPage).toBe(false)
    expect(lastJson.data.errors.pageInfo.hasPreviousPage).toBe(true)
    const lastCursor = lastJson.data.errors.edges[0].cursor

    const beforeLastQuery = `
      query {
        errors(last: 1, before: "${lastCursor}") {
          edges {
            cursor
            node {
              code
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `
    const beforeLastRequest = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: beforeLastQuery }),
    })
    const beforeLastResult = await POST(beforeLastRequest)

    const beforeLastJson = await beforeLastResult.json()
    expect(beforeLastJson.errors).toBeUndefined()
    expect(beforeLastJson.data.errors.edges).toHaveLength(1)
    expect(beforeLastJson.data.errors.pageInfo.hasNextPage).toBe(true)
    expect(beforeLastJson.data.errors.edges[0].node.code).not.toBe(
      lastJson.data.errors.edges[0].node.code
    )
  })
})
