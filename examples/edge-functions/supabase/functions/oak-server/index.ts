import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts'

const router = new Router()
router
  // Note: path should be prefixed with function name
  .get('/oak-server', (context) => {
    context.response.body = 'This is an example Oak server running on Edge Functions!'
  })
  .post('/oak-server/greet', async (context) => {
    // Note: request body will be streamed to the function as chunks, set limit to 0 to fully read it.
    const result = context.request.body({ type: 'json', limit: 0 })
    const body = await result.value
    const name = body.name || 'you'

    context.response.body = { msg: `Hey ${name}!` }
  })
  .get('/oak-server/redirect', (context) => {
    context.response.redirect('https://www.example.com')
  })

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

await app.listen({ port: 8000 })
