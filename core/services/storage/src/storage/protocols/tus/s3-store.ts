import { type Options, S3Store as TusS3Store } from '@tus/s3-store'

export class S3Store extends TusS3Store {
  constructor(options: Options) {
    super(options)
    this.client.middlewareStack.remove('loggerMiddleware')
  }
}
