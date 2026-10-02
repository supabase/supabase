import fs from 'fs'
import { mkdir } from 'fs/promises'
import path from 'path'
import { pipeline } from 'stream/promises'

export interface OrphanObject {
  event: 'data'
  type: 'dbOrphans' | 's3Orphans'
  value: {
    name: string
    version: string
    size: number
  }[]
}

export interface PingObject {
  event: 'ping'
}

export interface StreamedErrorPayload {
  statusCode: string
  code: string
  error: string
  message: string
}

export interface ErrorObject {
  event: 'error'
  error: StreamedErrorPayload
}

export type OrphanStreamEvent = OrphanObject | PingObject | ErrorObject

export function formatOrphanStreamError(error: StreamedErrorPayload) {
  return `[${error.code}] ${error.message}`
}

export async function writeStreamToJsonArray(
  stream: NodeJS.ReadableStream,
  filePath: string
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })

  const localFile = fs.createWriteStream(filePath)
  let isFirstItem = true
  let receivedAnyData = false
  let streamedError: Error | undefined
  let deleteLimitReached = false
  let inputStreamError: Error | undefined

  const jsonArrayStream = (async function* () {
    yield '[\n'

    try {
      for await (const data of stream as AsyncIterable<OrphanStreamEvent>) {
        if (data.event === 'ping') {
          console.log('Received ping event, ignoring')
          continue
        }

        if (data.event === 'error') {
          streamedError = new Error(formatOrphanStreamError(data.error))
          console.error('Server error:', formatOrphanStreamError(data.error))
          continue
        }

        if (data.event === 'data' && Array.isArray(data.value)) {
          receivedAnyData = true
          console.log(`Processing ${data.value.length} objects`)

          for (const item of data.value) {
            if (!isFirstItem) {
              yield ',\n'
            } else {
              isFirstItem = false
            }

            yield JSON.stringify({ ...item, orphanType: data.type }, null, 2)
          }
          continue
        }

        console.warn(
          'Received data with invalid format:',
          JSON.stringify(data).substring(0, 100) + '...'
        )
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'DELETE_LIMIT_REACHED') {
        deleteLimitReached = true
      } else {
        inputStreamError =
          err instanceof Error ? err : new Error('Unexpected stream failure', { cause: err })
        console.error('Stream error:', inputStreamError)
      }
    }

    yield '\n]'
  })()

  await pipeline(jsonArrayStream, localFile)

  if (inputStreamError) {
    throw inputStreamError
  }

  if (streamedError) {
    throw streamedError
  }

  if (!receivedAnyData) {
    console.warn(`No data was received! File might be empty: ${filePath}`)
    return
  }

  if (deleteLimitReached) {
    console.log(`Finished writing data to ${filePath}. Delete limit reached, data saved.`)
    return
  }

  console.log(`Finished writing data to ${filePath}. Data was received and saved.`)
}
