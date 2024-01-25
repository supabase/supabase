export function getProjectRef(url: string): string | null {
  const regex: RegExp = /https:\/\/([^\.]+)\./
  const match: RegExpMatchArray | null = url.match(regex)

  if (match) {
    return match[1]
  } else {
    return null
  }
}
