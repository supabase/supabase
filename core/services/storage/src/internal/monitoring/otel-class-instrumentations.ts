import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { PgTenantConnection } from '@internal/database'
import { Event as QueueBaseEvent } from '@internal/queue'
import { S3Backend } from '@storage/backend'
import { StoragePgDB } from '@storage/database'
import { ObjectStorage } from '@storage/object'
import { PgLock } from '@storage/protocols/tus'
import { Storage } from '@storage/storage'
import { Uploader } from '@storage/uploader'
import { S3Store } from '@tus/s3-store'
import { StreamSplitter } from '@tus/server'
import { ClassInstrumentation } from './otel-instrumentation'

export const classInstrumentations = [
  new ClassInstrumentation({
    targetClass: Storage,
    enabled: true,
    methodsToInstrument: [
      'findBucket',
      'getBucketLifecycle',
      'putBucketLifecycle',
      'deleteBucketLifecycle',
      'listBuckets',
      'createBucket',
      'updateBucket',
      'countObjects',
      'deleteBucket',
      'emptyBucket',
      'healthcheck',
    ],
  }),
  new ClassInstrumentation({
    targetClass: ObjectStorage,
    enabled: true,
    methodsToInstrument: [
      'uploadNewObject',
      'uploadOverridingObject',
      'deleteObject',
      'deleteObjects',
      'updateObjectOwner',
      'findObject',
      'findObjects',
      'copyObject',
      'moveObject',
      'searchObjects',
      'listObjectsV2',
      'signObjectUrl',
      'signObjectUrls',
      'signUploadObjectUrl',
      'verifyObjectSignature',
    ],
  }),
  new ClassInstrumentation({
    targetClass: Uploader,
    enabled: true,
    methodsToInstrument: ['canUpload', 'prepareUpload', 'upload', 'completeUpload'],
  }),
  new ClassInstrumentation({
    targetClass: QueueBaseEvent,
    enabled: true,
    methodsToInstrument: ['send', 'batchSend'],
    setName: (name, attrs, eventClass) => {
      const eventName = eventClass.constructor?.name
      if (eventName) {
        return name + '.' + eventName
      }
      return name
    },
  }),
  new ClassInstrumentation({
    targetClass: S3Backend,
    enabled: true,
    methodsToInstrument: [
      'getObject',
      'putObject',
      'deleteObject',
      'listObjects',
      'copyObject',
      'headObject',
      'createMultipartUpload',
      'uploadPart',
      'completeMultipartUpload',
      'abortMultipartUpload',
      'listMultipartUploads',
      'listParts',
      'getSignedUrl',
      'createBucket',
      'deleteBucket',
      'listBuckets',
      'getBucketLocation',
      'uploadObject',
      'privateAssetUrl',
    ],
  }),
  new ClassInstrumentation({
    targetClass: StoragePgDB,
    enabled: true,
    methodsToInstrument: ['runQuery'],
    setName: (name, attrs) => {
      if (typeof attrs.queryName === 'string') {
        return name + '.' + attrs.queryName
      }
      return name
    },
    setAttributes: {
      runQuery: (queryName) => {
        return {
          queryName: String(queryName),
        }
      },
    },
  }),
  new ClassInstrumentation({
    targetClass: PgTenantConnection,
    enabled: true,
    methodsToInstrument: ['transaction', 'setScope'],
  }),
  new ClassInstrumentation({
    targetClass: S3Store,
    enabled: true,
    methodsToInstrument: [
      'write',
      'create',
      'remove',
      'getUpload',
      'declareUploadLength',
      'uploadIncompletePart',
      'uploadPart',
      'downloadIncompletePart',
      'uploadParts',
    ],
    setName: (name) => 'Tus.' + name,
  }),
  new ClassInstrumentation({
    targetClass: StreamSplitter,
    enabled: true,
    methodsToInstrument: ['emitEvent'],
    setName: (name, attrs) => {
      if (typeof attrs.event === 'string') {
        return name + '.' + attrs.event
      }
      return name
    },
    setAttributes: {
      emitEvent(this: unknown, event) {
        const splitter = this as unknown as StreamSplitter
        return {
          part: splitter.part,
          event: String(event),
        }
      },
    },
  }),
  new ClassInstrumentation({
    targetClass: PgLock,
    enabled: true,
    methodsToInstrument: ['lock', 'unlock', 'acquireLock'],
  }),
  new ClassInstrumentation({
    targetClass: S3Client,
    enabled: true,
    methodsToInstrument: ['send'],
    setAttributes: {
      send: (command) => {
        return {
          operation: getConstructorName(command),
        }
      },
    },
    setName: (name, attrs) =>
      typeof attrs.operation === 'string' ? 'S3.' + attrs.operation : name,
  }),
  new ClassInstrumentation({
    targetClass: Upload,
    enabled: true,
    methodsToInstrument: [
      'done',
      '__uploadUsingPut',
      '__createMultipartUpload',
      'markUploadAsAborted',
    ],
  }),
]

function getConstructorName(value: unknown): string {
  if (value && typeof value === 'object' && value.constructor?.name) {
    return value.constructor.name
  }

  return 'unknown'
}

export async function loadClassInstrumentations() {
  return classInstrumentations
}
