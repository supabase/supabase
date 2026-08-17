import {
  TROUBLESHOOTING_DIAGNOSTIC_SOURCES,
  TroubleshootingSchema,
} from '~/features/docs/Troubleshooting.utils.common.mjs'

export function serializeTroubleshootingIndexEntry(data: unknown, url: string): string {
  const metadata = TroubleshootingSchema.parse(data)
  const errors =
    metadata.errors
      ?.map((error) => {
        const identifier = `${error.http_status_code ?? ''}${error.http_status_code && error.code ? ' ' : ''}${error.code ?? ''}`
        return [identifier, error.message].filter(Boolean).join(': ')
      })
      .filter(Boolean) ?? []
  const details = [
    errors.length ? `  - Errors: ${errors.join(', ')}` : null,
    `  - Where to check: ${metadata.diagnostic_sources
      .map(
        (source) =>
          TROUBLESHOOTING_DIAGNOSTIC_SOURCES[
            source as keyof typeof TROUBLESHOOTING_DIAGNOSTIC_SOURCES
          ]
      )
      .join(', ')}`,
    `  - Likely meaning: ${metadata.summary}`,
    `  - Product: ${metadata.topics.join(', ')}`,
  ].filter((detail): detail is string => detail !== null)

  return [`- Symptom or error: [**${metadata.title}**](${url})`, ...details].join('\n')
}
