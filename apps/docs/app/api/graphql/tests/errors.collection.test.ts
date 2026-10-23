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
    // Base64 encode the UUID that's guaranteed to be after any real data
    const afterCursor = Buffer.from('ffffffff-ffff-ffff-ffff-ffffffffffff', 'utf8').toString(
      'base64'
    )
    const query = `
      query {
        errors(first: 1, after: "${afterCursor}") {
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

  it('filters by service when service argument is provided', async () => {
    // First, get all errors to check we have errors from different services
    const allErrorsQuery = `
      query {
        errors {
          nodes {
            service
          }
        }
      }
    `
    const allRequest = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: allErrorsQuery }),
    })
    const allResult = await POST(allRequest)
    const allJson = await allResult.json()
    expect(allJson.errors).toBeUndefined()

    // Verify we have errors from multiple services
    const services = new Set(allJson.data.errors.nodes.map((e: any) => e.service))
    expect(services.size).toBeGreaterThan(1)

    // Test filtering by AUTH service
    const authErrorsQuery = `
      query {
        errors(service: AUTH) {
          totalCount
          nodes {
            code
            service
          }
        }
      }
    `
    const authRequest = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: authErrorsQuery }),
    })

    const authResult = await POST(authRequest)
    const authJson = await authResult.json()
    expect(authJson.errors).toBeUndefined()

    // Verify all returned errors are from AUTH service
    expect(authJson.data.errors.nodes.length).toBeGreaterThan(0)
    expect(authJson.data.errors.nodes.every((e: any) => e.service === 'AUTH')).toBe(true)
  })

  it('supports service filtering with pagination', async () => {
    const firstPageQuery = `
      query {
        errors(service: AUTH, first: 1) {
          edges {
            cursor
            node {
              code
              service
            }
          }
          pageInfo {
            hasNextPage
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

    // Verify the returned error is from AUTH service
    expect(firstJson.data.errors.edges[0].node.service).toBe('AUTH')

    // If there are more AUTH errors, test pagination
    if (firstJson.data.errors.pageInfo.hasNextPage) {
      const cursor = firstJson.data.errors.pageInfo.endCursor
      const secondPageQuery = `
        query {
          errors(service: AUTH, first: 1, after: "${cursor}") {
            edges {
              node {
                code
                service
              }
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

      // Verify the second page also returns AUTH errors
      expect(secondJson.data.errors.edges[0].node.service).toBe('AUTH')
      // And it's a different error
      expect(secondJson.data.errors.edges[0].node.code).not.toBe(
        firstJson.data.errors.edges[0].node.code
      )
    }
  })

  it('filters by code when code argument is provided', async () => {
    // First, get the first error code from the database to test with
    const { data: dbErrors } = await supabase()
      .schema('content')
      .from('error')
      .select('code')
      .is('deleted_at', null)
      .limit(1)

    expect(dbErrors).not.toBe(null)
    expect(dbErrors).toHaveLength(1)
    const testCode = dbErrors![0].code

    const codeFilterQuery = `
      query {
        errors(code: "${testCode}") {
          totalCount
          nodes {
            code
            service
          }
        }
      }
    `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: codeFilterQuery }),
    })

    const result = await POST(request)
    const json = await result.json()
    expect(json.errors).toBeUndefined()

    // Verify all returned errors have the specified code
    expect(json.data.errors.nodes.length).toBeGreaterThan(0)
    expect(json.data.errors.nodes.every((e: any) => e.code === testCode)).toBe(true)
  })

  it('filters by both service and code when both arguments are provided', async () => {
    // Get an error that exists for AUTH service
    const { data: authError } = await supabase()
      .schema('content')
      .from('error')
      .select('code, ...service(service:name)')
      .is('deleted_at', null)
      .eq('service.name', 'AUTH')
      .limit(1)

    expect(authError).not.toBe(null)
    expect(authError).toHaveLength(1)
    const testCode = authError![0].code

    const bothFiltersQuery = `
      query {
        errors(service: AUTH, code: "${testCode}") {
          totalCount
          nodes {
            code
            service
          }
        }
      }
    `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: bothFiltersQuery }),
    })

    const result = await POST(request)
    const json = await result.json()
    expect(json.errors).toBeUndefined()

    // Verify all returned errors match both filters
    expect(json.data.errors.nodes.length).toBeGreaterThan(0)
    expect(
      json.data.errors.nodes.every((e: any) => e.code === testCode && e.service === 'AUTH')
    ).toBe(true)
  })

  it('returns empty list when code filter matches no errors', async () => {
    const nonExistentCodeQuery = `
      query {
        errors(code: "NONEXISTENT_CODE_12345") {
          totalCount
          nodes {
            code
          }
        }
      }
    `
    const request = new Request('http://localhost/api/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: nonExistentCodeQuery }),
    })

    const result = await POST(request)
    const json = await result.json()
    expect(json.errors).toBeUndefined()
    expect(json.data.errors.totalCount).toBe(0)
    expect(json.data.errors.nodes).toHaveLength(0)
  })
})
