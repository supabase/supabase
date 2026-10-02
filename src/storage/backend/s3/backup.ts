import {
  AbortMultipartUploadCommand,
  CompletedPart,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  S3Client,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3'

const FIVE_GB = 5 * 1024 * 1024 * 1024

export interface BackupObjectInfo {
  // Source Object Details
  sourceBucket: string
  sourceKey: string

  // Destination Object Details
  destinationBucket: string
  destinationKey: string

  size: number
}

/**
 * Class representing an object backup operation between S3 buckets.
 */
export class ObjectBackup {
  private static readonly MAX_PART_SIZE = 5 * 1024 * 1024 * 1024 // 5 GB per part
  private static readonly MAX_CONCURRENT_UPLOADS = 5 // Adjust based on your system's capabilities
  private s3Client: S3Client
  private objectInfo: BackupObjectInfo

  /**
   * Creates an instance of ObjectBackup.
   * @param s3Client - An instance of S3Client.
   * @param objectInfo - Information about the object to be backed up.
   */
  constructor(s3Client: S3Client, objectInfo: BackupObjectInfo) {
    this.s3Client = s3Client
    this.objectInfo = objectInfo
  }

  /**
   * Initiates the backup (copy) process for the specified object.
   */
  public async backup(): Promise<void> {
    const { size } = this.objectInfo

    if (size > FIVE_GB) {
      // Perform multipart copy for large files
      await this.multipartCopy()
    } else {
      // Perform single copy for smaller files
      await this.singleCopy()
    }
  }

  /**
   * Performs a single copy operation for objects <= 5GB.
   */
  private async singleCopy(): Promise<void> {
    const { sourceBucket, sourceKey, destinationBucket, destinationKey } = this.objectInfo

    const copyParams = {
      Bucket: destinationBucket,
      Key: destinationKey,
      CopySource: encodeURIComponent(`/${sourceBucket}/${sourceKey}`),
    }

    const copyCommand = new CopyObjectCommand(copyParams)
    await this.s3Client.send(copyCommand)
  }

  /**
   * Performs a multipart copy operation for objects > 5GB.
   */
  private async multipartCopy(): Promise<void> {
    const { destinationBucket, destinationKey, size } = this.objectInfo

    // Step 1: Initiate Multipart Upload
    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: destinationBucket,
      Key: destinationKey,
    })

    const createMultipartUploadResponse = await this.s3Client.send(createMultipartUploadCommand)
    const uploadId = createMultipartUploadResponse.UploadId

    if (!uploadId) {
      throw new Error('Failed to initiate multipart upload.')
    }

    const maxPartSize = ObjectBackup.MAX_PART_SIZE
    const numParts = Math.ceil(size / maxPartSize)
    const completedParts: CompletedPart[] = []

    try {
      // Step 2: Copy Parts Concurrently
      await this.copyPartsConcurrently(uploadId, numParts, size, completedParts)

      // Step 3: Sort the completed parts by PartNumber
      completedParts.sort((a, b) => (a.PartNumber! < b.PartNumber! ? -1 : 1))

      // Step 4: Complete Multipart Upload
      const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
        Bucket: destinationBucket,
        Key: destinationKey,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: completedParts,
        },
      })

      await this.s3Client.send(completeMultipartUploadCommand)
    } catch (error) {
      // Abort the multipart upload in case of failure
      const abortMultipartUploadCommand = new AbortMultipartUploadCommand({
        Bucket: destinationBucket,
        Key: destinationKey,
        UploadId: uploadId,
      })

      await this.s3Client.send(abortMultipartUploadCommand)
      throw error
    }
  }

  /**
   * Copies parts of the object concurrently.
   * @param uploadId - The UploadId from the initiated multipart upload.
   * @param numParts - Total number of parts to copy.
   * @param size - Total size of the object in bytes.
   * @param completedParts - Array to store completed parts information.
   */
  private async copyPartsConcurrently(
    uploadId: string,
    numParts: number,
    size: number,
    completedParts: CompletedPart[]
  ): Promise<void> {
    const { sourceBucket, sourceKey, destinationBucket, destinationKey } = this.objectInfo
    const partSize = ObjectBackup.MAX_PART_SIZE
    let currentPart = 1

    // Worker function to copy a single part
    const copyPart = async (partNumber: number): Promise<void> => {
      const start = (partNumber - 1) * partSize
      const end = partNumber * partSize < size ? partNumber * partSize - 1 : size - 1

      const uploadPartCopyCommand = new UploadPartCopyCommand({
        Bucket: destinationBucket,
        Key: destinationKey,
        PartNumber: partNumber,
        UploadId: uploadId,
        CopySource: encodeURIComponent(`/${sourceBucket}/${sourceKey}`),
        CopySourceRange: `bytes=${start}-${end}`,
      })

      const uploadPartCopyResponse = await this.s3Client.send(uploadPartCopyCommand)

      if (!uploadPartCopyResponse.CopyPartResult?.ETag) {
        throw new Error(`Failed to copy part ${partNumber}. No ETag returned.`)
      }

      completedParts.push({
        ETag: uploadPartCopyResponse.CopyPartResult.ETag,
        PartNumber: partNumber,
      })
    }

    // Array to hold active worker promises
    const workers: Promise<void>[] = []

    // Start concurrent workers
    for (let i = 0; i < ObjectBackup.MAX_CONCURRENT_UPLOADS && currentPart <= numParts; i++) {
      const worker = (async () => {
        while (currentPart <= numParts) {
          const partToCopy = currentPart
          currentPart += 1
          await copyPart(partToCopy)
        }
      })()
      workers.push(worker)
    }

    // Wait for all workers to complete
    await Promise.all(workers)
  }
}
