import db from 'mime-db'

export const MIME_TYPES_BY_EXTENSION = Object.fromEntries(
  Object.entries(db)
    .filter(([, { extensions }]) => extensions !== undefined)
    .flatMap(([mime, { extensions }]) =>
      extensions!.map((extension) => [extension.toLowerCase(), mime])
    )
)

export function lookupMime(extension?: string): string | undefined {
  if (extension === undefined) {
    return undefined
  }

  return MIME_TYPES_BY_EXTENSION[extension.toLowerCase()]
}
