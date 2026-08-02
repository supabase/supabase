import http from 'http'

const SOCKET_PATH = process.env.ALAZAB_AUTH_MANAGER_SOCKET || '/run/alazab-auth-manager.sock'

export interface ManagerResponse<T = any> {
  status: number
  data: T
}

export async function requestManager<T = any>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  payload?: any
): Promise<ManagerResponse<T>> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      socketPath: SOCKET_PATH,
      path,
      method,
      headers: {},
    }

    if (payload) {
      options.headers!['Content-Type'] = 'application/json'
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode || 200, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode || 200, data: data as unknown as T })
        }
      })
    })

    req.on('error', (err) => {
      console.error(`[AuthManagerClient] Request failed: ${err.message}`)
      reject(err)
    })

    if (payload) {
      req.write(JSON.stringify(payload))
    }
    req.end()
  })
}
