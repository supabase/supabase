import { promises as fs } from 'fs'
import buildAdmin from '../admin-app'
import app from '../app'
;(async () => {
  // Export main API spec
  const storageApp = app({
    exposeDocs: true,
  })

  const response = await storageApp.inject({
    method: 'GET',
    url: '/documentation/json',
  })
  if (response.statusCode !== 200) {
    throw new Error('Unable to get api spec: ' + response.statusCode + ' ' + response.statusMessage)
  }

  await fs.writeFile('static/api.json', response.body)

  await storageApp.close()

  // Export admin API spec
  const adminApp = buildAdmin({
    exposeDocs: true,
  })

  const adminResponse = await adminApp.inject({
    method: 'GET',
    url: '/documentation/json',
  })
  if (adminResponse.statusCode !== 200) {
    throw new Error(
      'Unable to get admin api spec: ' +
        adminResponse.statusCode +
        ' ' +
        adminResponse.statusMessage
    )
  }

  await fs.writeFile('static/api-admin.json', adminResponse.body)

  await adminApp.close()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
