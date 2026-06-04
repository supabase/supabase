import { z } from 'zod'

const HTTP_URL_PROTOCOL_REGEX = /^https?:\/\//
const IPV4_SEGMENT = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)'
const IPV4_REGEX = new RegExp(`^(?:${IPV4_SEGMENT}\\.){3}${IPV4_SEGMENT}$`)
const BRACKETED_IPV6_REGEX = /^\[[0-9a-f:.]+\]$/i

export const hasHttpUrlProtocol = (value: string) => HTTP_URL_PROTOCOL_REGEX.test(value)

export const isValidHttpEndpointUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

    const { hostname } = url
    return (
      hostname === 'localhost' ||
      hostname.includes('.') ||
      IPV4_REGEX.test(hostname) ||
      BRACKETED_IPV6_REGEX.test(hostname)
    )
  } catch {
    return false
  }
}

type HttpEndpointUrlSchemaOptions = {
  requiredMessage: string
  invalidMessage: string
  prefixMessage: string
}

export const httpEndpointUrlSchema = ({
  requiredMessage,
  invalidMessage,
  prefixMessage,
}: HttpEndpointUrlSchemaOptions) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .superRefine((value, ctx) => {
      if (!value) return

      if (!hasHttpUrlProtocol(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: prefixMessage,
        })
        return
      }

      if (!isValidHttpEndpointUrl(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: invalidMessage,
        })
      }
    })
