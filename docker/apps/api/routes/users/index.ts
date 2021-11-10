import { NowRequestHandler } from 'fastify-now'

export const GET: NowRequestHandler = async function (request, response) {
  const supabaseAdmin = this.supabase.admin

  const { data, error, status } = await supabaseAdmin.from('people').select()

  if (error) {
    return response.status(500).send({
      status: 500,
      error: error.message,
    })
  }

  return data
}
