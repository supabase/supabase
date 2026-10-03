import { ERRORS } from '@internal/errors'
import { getConfig } from '../../../config'
import { FILE_VERSION_SEPARATOR, PATH_SEPARATOR, SEPARATOR } from '../../backend'
import { mustBeValidBucketName, mustBeValidKey } from '../../limits'

interface ResourceIDOptions {
  tenant: string
  bucket: string
  objectName: string
  version: string
}

const { tusUseFileVersionSeparator } = getConfig()

export class UploadId {
  public readonly tenant: string
  public readonly bucket: string
  public readonly objectName: string
  public readonly version: string

  constructor(options: ResourceIDOptions) {
    this.tenant = options.tenant
    this.bucket = options.bucket
    this.objectName = options.objectName
    this.version = options.version

    mustBeValidBucketName(options.bucket)
    mustBeValidKey(options.objectName)

    if (!options.tenant) {
      throw ERRORS.InvalidTenantId()
    }

    if (!options.version) {
      throw ERRORS.InvalidUploadId('Version not provided')
    }
  }

  static fromString(id: string) {
    const uploadInfo = tusUseFileVersionSeparator ? fromFileSeparator(id) : fromPathSeparator(id)

    return new this(uploadInfo)
  }

  toString() {
    const separator = tusUseFileVersionSeparator ? FILE_VERSION_SEPARATOR : PATH_SEPARATOR
    return `${this.tenant}/${this.bucket}/${this.objectName}${separator}${this.version}`
  }
}

function fromPathSeparator(id: string) {
  const idParts = id.split(PATH_SEPARATOR)

  if (idParts.length < 3) {
    throw ERRORS.InvalidUploadId()
  }

  const [tenant, bucket, ...objParts] = idParts
  const version = objParts.pop()

  if (!version) {
    throw ERRORS.InvalidUploadId('Version not provided')
  }

  return {
    version,
    objectName: objParts.join('/'),
    tenant,
    bucket,
  }
}

function fromFileSeparator(id: string) {
  const idParts = id.split(PATH_SEPARATOR)

  if (idParts.length < 3) {
    throw ERRORS.InvalidUploadId()
  }

  const [tenant, bucket, ...objParts] = idParts
  const objectWithVersion = objParts.pop()

  const separator = SEPARATOR
  const objectNameParts = objectWithVersion?.split(separator) || []

  if (objectNameParts.length < 2) {
    throw ERRORS.InvalidUploadId('Object name is invalid')
  }

  const version = objectNameParts[1]
  const objectName = objectNameParts[0]

  if (!version) {
    throw ERRORS.InvalidUploadId('Version not provided')
  }

  objParts.push(objectName)

  return {
    version,
    objectName: objParts.join('/'),
    tenant,
    bucket,
  }
}
