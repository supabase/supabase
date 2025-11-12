export type ResponseData = {
  status: number
  headers: Record<string, string>
  body: string
}

export type ErrorWithStatus = Error & {
  cause?: {
    status: number
  }
}
