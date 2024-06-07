import { API_URL } from 'lib/constants'
import { HttpResponse, http } from 'msw'

const PROJECT_REF = 'ref'

export const APIMock = [
  http.get(`${API_URL}/msw/test`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),
  http.get(`/api/projects/${PROJECT_REF}/analytics/endpoints/logs.all`, ({ request }) => {
    const url = new URL(request.url)
    const sql = url.searchParams.get('sql')

    if (sql === 'select count(*) as my_count from edge_logs') {
      return HttpResponse.json({
        result: [
          {
            my_count: 50,
          },
        ],
      })
    } else {
      console.log('🔵 Return 2')
      return HttpResponse.json({
        result: [
          {
            timestamp: '2024-06-06T13:19:35.106000',
            my_count: '12345',
            event_message: '12345',
            metadata: [
              {
                foo: 'bar',
                hello: 'world',
              },
            ],
          },
        ],
      })
    }
  }),
]
