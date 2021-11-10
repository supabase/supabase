import { NowRequestHandler } from 'fastify-now'

export const GET: NowRequestHandler = async (req, rep) => {
  return { 
    status: 200,
    timestamp: new Date()
  }
}
