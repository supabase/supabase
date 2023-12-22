import { ExceptionList } from '../config/exceptions/exceptions'

export const symbolRegex = /[^\s\w]+/

interface Token {
  value: string
  matchedException?: boolean
  positionInParent: {
    columnZeroIndexed: number // 0-indexed
  }
}

export function tokenize(
  s: string,
  { exceptions = [] }: { exceptions?: ExceptionList[] } = {}
): Token[] {
  if (!s) return []

  const result = []

  const wordOrSymbolRegex = /\w+|[^\s\w]+/g

  let currMatch: RegExpExecArray
  while ((currMatch = wordOrSymbolRegex.exec(s)) !== null) {
    const token = currMatch[0]
    const position = currMatch.index

    const isTokenSymbol = symbolRegex.test(token)
    if (isTokenSymbol) {
      result.push({
        value: token,
        positionInParent: { columnZeroIndexed: position },
      } satisfies Token)
      continue
    }

    const matchingExceptions = exceptions
      .map((exception) =>
        exception.matchException({
          word: token,
          fullString: s,
          index: currMatch.index,
        })
      )
      .filter((match) => match.exception)
      .sort((a, b) => b.advanceIndexBy - a.advanceIndexBy)

    if (matchingExceptions.length === 0) {
      result.push({
        value: token,
        positionInParent: { columnZeroIndexed: position },
      } satisfies Token)
    } else {
      const mostCompleteException = matchingExceptions[0]
      result.push({
        value: mostCompleteException.match || token,
        matchedException: true,
        positionInParent: { columnZeroIndexed: position },
      } satisfies Token)
      wordOrSymbolRegex.lastIndex += mostCompleteException.advanceIndexBy
    }
  }

  return result satisfies Token[]
}
