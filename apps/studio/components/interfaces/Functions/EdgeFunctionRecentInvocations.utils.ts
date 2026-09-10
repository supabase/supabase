/**
 * Parses an edge function invocation event_message to extract the meaningful
 * content, stripping out the method and status code that are already displayed
 * as structured fields.
 *
 * The event_message typically follows the format:
 *   "{METHOD} | {STATUS_CODE} | {URL_OR_DETAIL}"
 *
 * e.g. "POST | 200 | https://example.supabase.red/functions/v1/hello-world"
 *
 * When the structured method and status_code fields match what's in the message,
 * we strip them out to avoid duplication. If parsing fails or the message doesn't
 * match the expected format, we return the original message as-is.
 */
export function parseEdgeFunctionEventMessage(
  eventMessage: string,
  method?: string,
  statusCode?: string
): string {
  if (!eventMessage) return eventMessage

  const parts = eventMessage.split(' | ')

  if (parts.length < 3) return eventMessage

  const messageMethod = parts[0].trim()
  const messageStatus = parts[1].trim()

  const methodMatches = method !== undefined && messageMethod === method
  const statusMatches = statusCode !== undefined && messageStatus === statusCode

  if (methodMatches && statusMatches) {
    return parts.slice(2).join(' | ').trim()
  }

  return eventMessage
}
