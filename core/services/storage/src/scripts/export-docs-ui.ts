import { promises as fs } from 'fs'
import { resolve } from 'path'

function swaggerInitializer(targetUrl: string) {
  return `window.onload = function () {
    const config = {
      dom_id: '#swagger-ui',
      deepLinking: true,
      url: '${targetUrl}'
    }
    const ui = SwaggerUIBundle(config)
  }`
}

;(async () => {
  const targetPath = 'swagger-ui'
  const swaggerPath = resolve('node_modules', '@fastify', 'swagger-ui', 'static')
  const specFile = 'api.json'
  const specPath = resolve('static', specFile)
  await fs.cp(swaggerPath, targetPath, { recursive: true })
  await fs.cp(specPath, resolve(targetPath, specFile))
  await fs.writeFile(resolve(targetPath, 'swagger-initializer.js'), swaggerInitializer(specFile))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
