import db from 'mime-db'

// [Alaister]: This is going to be moved to the server side
// so can be removed once the server side is ready

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
