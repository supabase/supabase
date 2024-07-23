import httpMocks from 'node-mocks-http'
import { expect, it, describe } from 'vitest'

import { GET } from './route'

describe('crawler page returns meta infromation', () => {
  it('title, description, canonical url', async () => {
    const request = httpMocks.createRequest({
      method: 'GET',
      url: '/reference/javascript/rpc',
    })
  })
})

describe('crawler page returns HTML for markdown section', () => {
  it('javascript/typescript support', async () => {
    const request = httpMocks.createRequest({
      method: 'GET',
      url: '/reference/javascript/rpc',
    })
  })
})
