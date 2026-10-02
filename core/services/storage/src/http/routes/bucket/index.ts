import { FastifyInstance } from 'fastify'
import { getConfig } from '../../../config'
import { setRestNotFoundHandler } from '../../not-found-handler'
import { db, registerJwtAuth, storage } from '../../plugins'
import createBucket from './createBucket'
import deleteBucket from './deleteBucket'
import emptyBucket from './emptyBucket'
import getAllBuckets from './getAllBuckets'
import getBucket from './getBucket'
import lifecycle from './lifecycle'
import updateBucket from './updateBucket'

const { dbServiceRole } = getConfig()

export default async function routes(fastify: FastifyInstance) {
  setRestNotFoundHandler(fastify)

  fastify.register(async function authenticated(fastify) {
    registerJwtAuth(fastify)
    fastify.register(db)
    fastify.register(storage)

    fastify.register(createBucket)
    fastify.register(getAllBuckets)
    fastify.register(getBucket)
    fastify.register(lifecycle)
    fastify.register(updateBucket)
    fastify.register(deleteBucket)
  })

  fastify.register(async function serviceRoleOnly(fastify) {
    registerJwtAuth(fastify, {
      enforceJwtRoles: [dbServiceRole],
    })
    fastify.register(db)
    fastify.register(storage)

    fastify.register(emptyBucket)
  })
}
