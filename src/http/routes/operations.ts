// This file defines all the operation names used in the application for better maintainability and to avoid typos.
// This file is linked from the docs to provide a list of all available operations.
// Any change to this file should be reflected in the docs if applicable.
export const ROUTE_OPERATIONS = {
  // Bucket
  CREATE_BUCKET: 'storage.bucket.create',
  DELETE_BUCKET: 'storage.bucket.delete',
  EMPTY_BUCKET: 'storage.bucket.empty',
  LIST_BUCKET: 'storage.bucket.list',
  GET_BUCKET: 'storage.bucket.get',
  UPDATE_BUCKET: 'storage.bucket.update',
  GET_BUCKET_LIFECYCLE: 'storage.bucket.get_lifecycle',
  PUT_BUCKET_LIFECYCLE: 'storage.bucket.put_lifecycle',
  DELETE_BUCKET_LIFECYCLE: 'storage.bucket.delete_lifecycle',

  // Object
  COPY_OBJECT: 'storage.object.copy',
  CREATE_OBJECT: 'storage.object.upload',
  DELETE_OBJECT: 'storage.object.delete',
  DELETE_OBJECTS: 'storage.object.delete_many',
  GET_PUBLIC_OBJECT: 'storage.object.get_public',
  GET_AUTH_OBJECT: 'storage.object.get_authenticated',
  INFO_AUTH_OBJECT: 'storage.object.info_authenticated', // not used
  INFO_PUBLIC_OBJECT: 'storage.object.info_public',
  GET_AUTH_OBJECT_INFO: 'object.get_authenticated_info', // legacy
  HEAD_AUTH_OBJECT_INFO: 'object.head_authenticated_info', // legacy
  GET_SIGNED_OBJECT: 'storage.object.get_signed',
  SIGN_UPLOAD_URL: 'storage.object.sign_upload_url',
  SIGN_OBJECT_URL: 'storage.object.sign',
  SIGN_OBJECT_URLS: 'storage.object.sign_many',
  LIST_OBJECTS: 'storage.object.list',
  LIST_OBJECTS_V2: 'storage.object.list_v2',
  MOVE_OBJECT: 'storage.object.move',
  UPDATE_OBJECT: 'storage.object.upload_update',
  UPLOAD_SIGN_OBJECT: 'storage.object.upload_signed',

  // CDN
  PURGE_OBJECT_CACHE: 'storage.cdn.purge_object_cache',
  PURGE_BUCKET_CACHE: 'storage.cdn.purge_bucket_cache',
  PURGE_TENANT_CACHE: 'storage.cdn.purge_tenant_cache',

  // Image Transformation
  RENDER_AUTH_IMAGE: 'storage.render.image_authenticated',
  RENDER_PUBLIC_IMAGE: 'storage.render.image_public',
  RENDER_SIGNED_IMAGE: 'storage.render.image_sign',

  // S3
  S3_ABORT_MULTIPART: 'storage.s3.upload.abort_multipart',
  S3_COMPLETE_MULTIPART: 'storage.s3.upload.complete_multipart',
  S3_CREATE_MULTIPART: 'storage.s3.upload.create_multipart',
  S3_LIST_MULTIPART: 'storage.s3.upload.list_multipart',
  S3_LIST_PARTS: 'storage.s3.upload.list_parts',
  S3_UPLOAD_PART: 'storage.s3.upload.part',
  S3_UPLOAD_PART_COPY: 'storage.s3.upload.part_copy',
  S3_UPLOAD: 'storage.s3.upload',

  // S3 Object
  S3_COPY_OBJECT: 'storage.s3.object.copy',
  S3_GET_OBJECT: 'storage.s3.object.get',
  S3_LIST_OBJECT: 'storage.s3.object.list',
  S3_HEAD_OBJECT: 'storage.s3.object.info',
  S3_DELETE_OBJECTS: 'storage.s3.object.delete_many',
  S3_DELETE_OBJECT: 'storage.s3.object.delete',
  S3_GET_OBJECT_TAGGING: 'storage.s3.object.get_tagging',

  // S3 Bucket
  S3_CREATE_BUCKET: 'storage.s3.bucket.create',
  S3_DELETE_BUCKET: 'storage.s3.bucket.delete',
  S3_GET_BUCKET: 'storage.s3.bucket.get',
  S3_HEAD_BUCKET: 'storage.s3.bucket.head',
  S3_LIST_BUCKET: 'storage.s3.bucket.list',
  S3_GET_BUCKET_LOCATION: 'storage.s3.bucket.get_location',
  S3_GET_BUCKET_VERSIONING: 'storage.s3.bucket.get_versioning',
  S3_GET_BUCKET_LIFECYCLE: 'storage.s3.bucket.get_lifecycle',
  S3_PUT_BUCKET_LIFECYCLE: 'storage.s3.bucket.put_lifecycle',
  S3_DELETE_BUCKET_LIFECYCLE: 'storage.s3.bucket.delete_lifecycle',

  // Tus
  TUS_CREATE_UPLOAD: 'storage.tus.upload.create',
  TUS_UPLOAD_PART: 'storage.tus.upload.part',
  TUS_GET_UPLOAD: 'storage.tus.upload.get',
  TUS_DELETE_UPLOAD: 'storage.tus.upload.delete',
  TUS_OPTIONS: 'storage.tus.options',

  // Iceberg
  ICEBERG_GET_CONFIG: 'storage.iceberg.config.get',
  ICEBERG_CREATE_NAMESPACE: 'storage.iceberg.namespace.create',
  ICEBERG_DROP_NAMESPACE: 'storage.iceberg.namespace.drop',
  ICEBERG_LIST_NAMESPACES: 'storage.iceberg.namespace.list',
  ICEBERG_LOAD_NAMESPACE: 'storage.iceberg.namespace.load',
  ICEBERG_NAMESPACE_EXISTS: 'storage.iceberg.namespace.exists',
  ICEBERG_LIST_TABLES: 'storage.iceberg.table.list',
  ICEBERG_LOAD_TABLE: 'storage.iceberg.table.load',
  ICEBERG_TABLE_EXISTS: 'storage.iceberg.table.exists',
  ICEBERG_CREATE_TABLE: 'storage.iceberg.table.create',
  ICEBERG_DROP_TABLE: 'storage.iceberg.table.drop',
  ICEBERG_COMMIT_TABLE: 'storage.iceberg.table.commit',

  // Vector
  CREATE_VECTOR_BUCKET: 'storage.vector.bucket.create',
  DELETE_VECTOR_BUCKET: 'storage.vector.bucket.delete',
  LIST_VECTOR_BUCKETS: 'storage.vector.bucket.list',
  GET_VECTOR_BUCKET: 'storage.vector.bucket.get',

  CREATE_VECTOR_INDEX: 'storage.vector.index.create',
  DELETE_VECTOR_INDEX: 'storage.vector.index.delete',
  LIST_VECTOR_INDEXES: 'storage.vector.index.list',
  GET_VECTOR_INDEX: 'storage.vector.index.get',

  GET_VECTORS: 'storage.vector.vectors.get',
  PUT_VECTORS: 'storage.vector.vectors.put',
  LIST_VECTORS: 'storage.vector.vectors.list',
  QUERY_VECTORS: 'storage.vector.vectors.query',
  DELETE_VECTORS: 'storage.vector.vectors.delete',
}
