import { Application } from 'https://deno.land/x/oak/mod.ts'

const app = new Application()

app.use(async (ctx) => {
  const result = ctx.request.body({ type: 'json', limit: 0 })
  const body = await result.value
  const name = body.name || 'you'

  ctx.response.body = { msg: `Hey ${name}!` }
})

await app.listen({ port: 8000 })
