import { SignatureV4Service } from '@storage/protocols/s3'
import { FastifyInstance } from 'fastify'
import { getConfig } from '../../../config'
import { setErrorHandler } from '../../error-handler'
import { setRestNotFoundHandler } from '../../not-found-handler'
import {
  dbSuperUser,
  enforceJwtRole,
  registerJwtAuth,
  requireTenantFeature,
  s3vector,
  signatureV4,
} from '../../plugins'
import createVectorBucket from './create-bucket'
import createVectorIndex from './create-index'
import deleteVectorBucket from './delete-bucket'
import deleteVectorIndex from './delete-index'
import deleteVectors from './delete-vectors'
import getVectorBucket from './get-bucket'
import getIndex from './get-index'
import getVectors from './get-vectors'
import listVectorBuckets from './list-buckets'
import listIndexes from './list-indexes'
import listVectors from './list-vectors'
import putVectors from './put-vectors'
import queryVectors from './query-vectors'

export default async function routes(fastify: FastifyInstance) {
  const { dbServiceRole, vectorEnabled, isMultitenant } = getConfig()

  setRestNotFoundHandler(fastify)

  if (!vectorEnabled && !isMultitenant) {
    return
  }

  fastify.register(async function authenticated(fastify) {
    if (isMultitenant) {
      fastify.register(requireTenantFeature('vectorBuckets'))
    }

    fastify.register(signatureV4, {
      service: SignatureV4Service.S3VECTORS,
      allowBodyHash: true,
      skipIfJwtToken: true,
    })

    registerJwtAuth(fastify, {
      skipIfAlreadyAuthenticated: true,
    })

    fastify.register(enforceJwtRole, {
      roles: [dbServiceRole],
    })

    fastify.register(dbSuperUser)
    fastify.register(s3vector)

    fastify.register(createVectorIndex)
    fastify.register(deleteVectorIndex)
    fastify.register(listIndexes)
    fastify.register(getIndex)

    fastify.register(createVectorBucket)
    fastify.register(deleteVectorBucket)
    fastify.register(listVectorBuckets)
    fastify.register(getVectorBucket)

    fastify.register(putVectors)
    fastify.register(queryVectors)
    fastify.register(deleteVectors)
    fastify.register(listVectors)
    fastify.register(getVectors)

    setErrorHandler(fastify, {
      respectStatusCode: true,
    })
  })
}
