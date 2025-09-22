import { type PostgrestError } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import util, { styleText } from 'node:util'
import { parse } from 'smol-toml'
import { Service } from '../../__generated__/graphql'
import { extractMessageFromAnyError, MultiError } from '../../app/api/utils'
import { Result } from '../../features/helpers.fn'
import { CONTENT_DIRECTORY } from '../../lib/docs'
import { DatabaseCorrected } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { type ErrorCodeDefinition } from './errorTypes'

type ErrorCodeUploadParameters =
  DatabaseCorrected['content']['Functions']['update_error_code']['Args']

const ERROR_CODES_DIRECTORY = path.join(CONTENT_DIRECTORY, 'errorCodes')

async function doFetchErrorCodes(
  file: string,
  service: Service
): Promise<Result<Array<ErrorCodeUploadParameters>, Error>> {
  return (
    await Result.tryCatch(
      () => readFile(path.join(ERROR_CODES_DIRECTORY, file), 'utf8'),
      (error) =>
        new Error(`Failed to read error code file ${file}: ${extractMessageFromAnyError(error)}`, {
          cause: error,
        })
    )
  )
    .flatMap((toml) =>
      Result.tryCatchSync(
        () => parse(toml) as unknown as Record<string, ErrorCodeDefinition>,
        (error) =>
          new Error(
            `Failed to parse error code file ${file}: ${extractMessageFromAnyError(error)}`,
            { cause: error }
          )
      )
    )
    .map((data) =>
      Object.entries(data).map(([code, definition]) => ({
        code,
        service,
        message: definition.description,
        metadata: {
          references: definition.references,
        },
      }))
    )
}

async function fetchErrorCodes(): Promise<Result<Array<ErrorCodeUploadParameters>, MultiError>> {
  const arrayOfResults = await Promise.all([
    doFetchErrorCodes('authErrorCodes.toml', Service.Auth),
    doFetchErrorCodes('realtimeErrorCodes.toml', Service.Realtime),
  ])
  return Result.transposeArray(arrayOfResults).map((result) => result.flat())
}

/**
 * Uploading the error codes to the database results in an array of Results.
 *
 * Handles each result and check whether it is a success or failure.
 * - If success, increment the count of upserted rows.
 * - If failure, add to a list of errors.
 */
function handleErrorCodeUploadErrors(
  results: Array<Result<boolean, PostgrestError>>,
  errorCodes: Array<{ code: string }>
): [number, MultiError | undefined] {
  return results.reduce(
    ([numberUpsertedRows, error], current, index) => {
      return current.match(
        (wasUpserted) =>
          wasUpserted ? [numberUpsertedRows + 1, error] : [numberUpsertedRows, error],
        (currentError) => [
          numberUpsertedRows,
          (
            error ?? new MultiError('All errors encountered when uploading error codes:')
          ).appendError(
            util.format(
              'Error uploading error code %s: %s',
              errorCodes[index].code,
              currentError.message
            ),
            currentError
          ),
        ]
      )
    },
    [0, undefined] as [number, MultiError | undefined]
  )
}

/**
 * Reads the error codes from the content directory and syncs them with the
 * database.
 *
 * Returns a result:
 * - Ok(numberUpsertedRows): The number of error codes that were successfully upserted.
 * - Err(error): An error that occurred during the upload process.
 */
async function uploadErrorCodes(
  errorCodes: Array<ErrorCodeUploadParameters>
): Promise<[number, MultiError<never> | undefined]> {
  return Promise.all(
    errorCodes.map(async (errorCode) => {
      return new Result(await supabaseAdmin().schema('content').rpc('update_error_code', errorCode))
    })
  )
    .then((data) => handleErrorCodeUploadErrors(data, errorCodes))
    .catch((error) => [
      0,
      new MultiError(`Error uploading error codes: ${extractMessageFromAnyError(error)}`, [error]),
    ])
}

/**
 * Deletes error codes that are no longer used.
 *
 * @returns A promise that resolves to a result:
 * - Ok(numberDeletedRows): The number of error codes that were successfully deleted.
 * - Err(error): An error that occurred during the deletion process.
 */
async function deleteUnusedErrorCodes(
  errorCodes: Array<ErrorCodeUploadParameters>
): Promise<Result<number, Error>> {
  const retainedErrorCodes = errorCodes.map((code) => ({
    error_code: code.code,
    service: code.service,
  }))
  return new Result(
    await supabaseAdmin()
      .schema('content')
      .rpc('delete_error_codes_except', { skip_codes: retainedErrorCodes })
  )
    .map((data) => data)
    .mapError(
      (error) =>
        new Error(util.format('Error deleting removed error codes: %s', error.message), {
          cause: error,
        })
    )
}

/**
 * Syncs error codes from the content files to the database.
 */
export async function syncErrorCodes(): Promise<Result<any, true>> {
  const TAG = '[Sync error codes]'
  const LOG_TAG = styleText('blue', TAG)
  const ERROR_TAG = styleText('red', TAG)
  function logWithTag(message: string) {
    console.log(`${LOG_TAG} ${message}`)
  }
  function errorWithTag(message: string) {
    console.error(`${ERROR_TAG} ${message}`)
  }

  logWithTag('Starting...')

  logWithTag('Fetching error codes...')
  return (await fetchErrorCodes())
    .mapError((error) => {
      errorWithTag(`Error syncing error codes: ${error.message}`)
      return true as const
    })
    .flatMapAsync(async (errorCodes) => {
      logWithTag(`Finished fetching ${errorCodes.length} error codes`)

      logWithTag('Uploading error codes...')
      const [numberUpserts, uploadError] = await uploadErrorCodes(errorCodes)
      logWithTag(`Upserted data for ${numberUpserts} error code(s)`)
      if (uploadError) {
        errorWithTag(
          `${uploadError.totalErrors} error(s) uploading error codes: ${uploadError.message}`
        )
      }

      logWithTag('Deleting unused error codes...')
      const deleteError = (await deleteUnusedErrorCodes(errorCodes)).match(
        (numberDeleted) => logWithTag(`Deleted ${numberDeleted} unused error code(s)`),
        (error) => {
          errorWithTag(error.message)
          return error
        }
      )

      return uploadError || deleteError ? Result.error(true) : Result.ok(undefined)
    })
}
