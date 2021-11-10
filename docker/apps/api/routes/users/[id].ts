import { NowRequestHandler } from 'fastify-now'

export const GET: NowRequestHandler<{ Params: { id: string } }> = async (req, rep) => {
  return { userId: req.params.id }
}

export const PUT: NowRequestHandler<{ Params: { id: string } }> = async (req, res) => {
  req.log.info(`updating user with id ${req.params.id}`)
  return { message: 'user updated' }
}