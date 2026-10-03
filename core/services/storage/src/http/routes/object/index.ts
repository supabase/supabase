import { FastifyInstance } from 'fastify'
import { setRestNotFoundHandler } from '../../not-found-handler'
import { db, dbSuperUser, registerJwtAuth, storage } from '../../plugins'
import copyObject from './copyObject'
import createObject from './createObject'
import deleteObject from './deleteObject'
import deleteObjects from './deleteObjects'
import getObject from './getObject'
import {
  authenticatedRoutes as getObjectInfoAuth,
  publicRoutes as getObjectInfoPublic,
} from './getObjectInfo'
import getPublicObject from './getPublicObject'
import getSignedObject from './getSignedObject'
import getSignedUploadURL from './getSignedUploadURL'
import getSignedURL from './getSignedURL'
import getSignedURLs from './getSignedURLs'
import listObjects from './listObjects'
import listObjectsV2 from './listObjectsV2'
import moveObject from './moveObject'
import updateObject from './updateObject'
import uploadSignedObject from './uploadSignedObject'

export default async function routes(fastify: FastifyInstance) {
  setRestNotFoundHandler(fastify)

  fastify.register(async function authenticated(fastify) {
    registerJwtAuth(fastify)
    fastify.register(db)
    fastify.register(storage)

    fastify.register(deleteObject)
    fastify.register(deleteObjects)
    fastify.register(getObject)
    fastify.register(getSignedUploadURL)
    fastify.register(getSignedURL)
    fastify.register(getSignedURLs)
    fastify.register(moveObject)
    fastify.register(updateObject)
    fastify.register(listObjectsV2)
    fastify.register(listObjects)
    fastify.register(getObjectInfoAuth)
    fastify.register(copyObject)
    fastify.register(createObject)
  })

  fastify.register(async (fastify) => {
    fastify.register(dbSuperUser)
    fastify.register(storage)

    fastify.register(getPublicObject)
    fastify.register(getSignedObject)
    fastify.register(uploadSignedObject)
    fastify.register(getObjectInfoPublic)
  })
}
