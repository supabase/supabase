import { handleRequest } from './src/http/app.ts'

const apiWorker = {
  fetch(request: Request): Promise<Response> {
    return handleRequest(request)
  },
}

export default apiWorker
