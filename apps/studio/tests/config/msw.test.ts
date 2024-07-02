import { API_URL } from 'lib/constants'

test('MSW works as expected', async () => {
  const res = await fetch(`${API_URL}/msw/test`)
  const json = await res.json()

  expect(res.status).toBe(200)
  expect(json).toEqual({ message: 'Hello from MSW!' })
})
