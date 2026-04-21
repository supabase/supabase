import z from 'zod/v4'

export type WrappedSuccessResult<T> = { data: T; error: undefined }
export type WrappedErrorResult = { data: undefined; error: Error }
export type WrappedResult<R> = WrappedSuccessResult<R> | WrappedErrorResult

export const databaseErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  formattedError: z.string(),
})

export class PgMetaDatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public formattedError: string
  ) {
    super(message)
    this.name = 'PgMetaDatabaseError'
  }
}
