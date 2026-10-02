import {
  AccessDeniedException,
  ConflictException,
  CreateIndexCommand,
  CreateIndexCommandInput,
  CreateIndexCommandOutput,
  DeleteIndexCommand,
  DeleteIndexCommandInput,
  DeleteIndexCommandOutput,
  DeleteVectorsCommand,
  DeleteVectorsInput,
  DeleteVectorsOutput,
  GetVectorsCommand,
  GetVectorsCommandInput,
  GetVectorsCommandOutput,
  ListVectorsCommand,
  ListVectorsInput,
  ListVectorsOutput,
  NotFoundException,
  PutVectorsCommand,
  PutVectorsInput,
  PutVectorsOutput,
  QueryVectorsCommand,
  QueryVectorsInput,
  QueryVectorsOutput,
  S3VectorsClient,
  ValidationException,
} from '@aws-sdk/client-s3vectors'
import { ERRORS } from '@internal/errors'
import { getConfig } from '../../../../config'

export interface VectorStore {
  maxDimensions?: number
  transactionalIndexOperations?: boolean
  createVectorIndex(command: CreateIndexCommandInput): Promise<CreateIndexCommandOutput>
  deleteVectorIndex(param: DeleteIndexCommandInput): Promise<DeleteIndexCommandOutput>
  putVectors(command: PutVectorsInput): Promise<PutVectorsOutput>
  listVectors(command: ListVectorsInput): Promise<ListVectorsOutput>

  queryVectors(queryInput: QueryVectorsInput): Promise<QueryVectorsOutput>

  deleteVectors(deleteVectorsInput: DeleteVectorsInput): Promise<DeleteVectorsOutput>

  getVectors(getVectorsInput: GetVectorsCommandInput): Promise<GetVectorsCommandOutput>
}

const { storageS3Region, vectorBucketRegion } = getConfig()

export function createS3VectorClient() {
  return new S3VectorsClient({
    region: vectorBucketRegion || storageS3Region,
  })
}

export class S3Vector implements VectorStore {
  constructor(protected readonly s3VectorClient: S3VectorsClient) {}

  getVectors(getVectorsInput: GetVectorsCommandInput): Promise<GetVectorsCommandOutput> {
    return this.handleError(
      () => this.s3VectorClient.send(new GetVectorsCommand(getVectorsInput)),
      { type: 'vector', name: getVectorsInput.indexName || 'unknown' }
    )
  }

  deleteVectors(deleteVectorsInput: DeleteVectorsInput): Promise<DeleteVectorsOutput> {
    return this.handleError(
      () => this.s3VectorClient.send(new DeleteVectorsCommand(deleteVectorsInput)),
      { type: 'vector', name: deleteVectorsInput.indexName || 'unknown' }
    )
  }

  queryVectors(queryInput: QueryVectorsInput): Promise<QueryVectorsOutput> {
    return this.handleError(() => this.s3VectorClient.send(new QueryVectorsCommand(queryInput)), {
      type: 'vector-index',
      name: queryInput.indexName || 'unknown',
    })
  }

  async listVectors(command: ListVectorsInput): Promise<ListVectorsOutput> {
    return this.handleError(() => this.s3VectorClient.send(new ListVectorsCommand(command)), {
      type: 'vector-index',
      name: command.indexName || 'unknown',
    })
  }

  putVectors(command: PutVectorsInput): Promise<PutVectorsOutput> {
    return this.handleError(() => this.s3VectorClient.send(new PutVectorsCommand(command)), {
      type: 'vector',
      name: command.indexName || 'unknown',
    })
  }

  deleteVectorIndex(param: DeleteIndexCommandInput): Promise<DeleteIndexCommandOutput> {
    return this.handleError(() => this.s3VectorClient.send(new DeleteIndexCommand(param)), {
      type: 'vector-index',
      name: param.indexName || 'unknown',
    })
  }

  async createVectorIndex(command: CreateIndexCommandInput): Promise<CreateIndexCommandOutput> {
    return this.handleError(() => this.s3VectorClient.send(new CreateIndexCommand(command)), {
      type: 'vector-index',
      name: command.indexName || 'unknown',
    })
  }

  protected async handleError<T>(
    fn: () => Promise<T>,
    resource: { type: string; name: string }
  ): Promise<T> {
    try {
      return await fn()
    } catch (e) {
      if (e instanceof ConflictException) {
        throw ERRORS.S3VectorConflictException(resource.type, resource.name)
      }

      if (e instanceof AccessDeniedException) {
        throw ERRORS.AccessDenied(
          'Access denied to S3 Vector service. Please check your permissions.'
        )
      }

      if (e instanceof NotFoundException) {
        throw ERRORS.S3VectorNotFoundException(resource.type, e.message)
      }

      if (e instanceof ValidationException) {
        throw ERRORS.InvalidParameter(resource.name, { error: e, message: e.message })
      }

      throw e
    }
  }
}
