import http from 'http'

const SOCKET_PATH = process.env.ALAZAB_AUTH_MANAGER_SOCKET || '/run/alazab-auth-manager/manager.sock'

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
      headers: {
        'X-Alazab-Manager-Token': process.env.ALAZAB_AUTH_MANAGER_TOKEN || '',
      },
      timeout: 10000,
    }

    const body = payload === undefined ? undefined : JSON.stringify(payload)
    if (body) {
      options.headers!['Content-Type'] = 'application/json'
      options.headers!['Content-Length'] = Buffer.byteLength(body)
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
    
    req.on('timeout', () => {
      console.error(`[AuthManagerClient] Request timed out`)
      req.destroy(new Error('Request Timeout'))
    })

    if (body) {
      req.write(body)
    }
    req.end()
  })
}
