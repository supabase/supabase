/**
 * Fuzzy match scorer. This is the same algorithm cmdk uses internally to
 * filter items (a port of https://github.com/superhuman/command-score, MIT),
 * which cmdk doesn't export. Keeping it identical means a section's rank here
 * agrees with which of its items cmdk considers a match.
 */
const SCORE_CONTINUE_MATCH = 1
const SCORE_SPACE_WORD_JUMP = 0.9
const SCORE_NON_SPACE_WORD_JUMP = 0.8
const SCORE_CHARACTER_JUMP = 0.17
const SCORE_TRANSPOSITION = 0.1
const PENALTY_SKIPPED = 0.999
const PENALTY_CASE_MISMATCH = 0.9999
const PENALTY_NOT_COMPLETE = 0.99

const IS_GAP_REGEXP = /[\\/_+.#"@[({&]/
const COUNT_GAPS_REGEXP = /[\\/_+.#"@[({&]/g
const IS_SPACE_REGEXP = /[\s-]/
const COUNT_SPACE_REGEXP = /[\s-]/g

function scoreInner(
  string: string,
  abbreviation: string,
  lowerString: string,
  lowerAbbreviation: string,
  stringIndex: number,
  abbreviationIndex: number,
  memo: Record<string, number>
): number {
  if (abbreviationIndex === abbreviation.length) {
    return stringIndex === string.length ? SCORE_CONTINUE_MATCH : PENALTY_NOT_COMPLETE
  }

  const memoKey = `${stringIndex},${abbreviationIndex}`
  if (memo[memoKey] !== undefined) return memo[memoKey]

  const abbreviationChar = lowerAbbreviation.charAt(abbreviationIndex)
  let index = lowerString.indexOf(abbreviationChar, stringIndex)
  let highScore = 0

  while (index >= 0) {
    let score = scoreInner(
      string,
      abbreviation,
      lowerString,
      lowerAbbreviation,
      index + 1,
      abbreviationIndex + 1,
      memo
    )

    if (score > highScore) {
      if (index === stringIndex) {
        score *= SCORE_CONTINUE_MATCH
      } else if (IS_GAP_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP
        const wordBreaks = string.slice(stringIndex, index - 1).match(COUNT_GAPS_REGEXP)
        if (wordBreaks && stringIndex > 0) score *= Math.pow(PENALTY_SKIPPED, wordBreaks.length)
      } else if (IS_SPACE_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP
        const spaceBreaks = string.slice(stringIndex, index - 1).match(COUNT_SPACE_REGEXP)
        if (spaceBreaks && stringIndex > 0) score *= Math.pow(PENALTY_SKIPPED, spaceBreaks.length)
      } else {
        score *= SCORE_CHARACTER_JUMP
        if (stringIndex > 0) score *= Math.pow(PENALTY_SKIPPED, index - stringIndex)
      }

      if (string.charAt(index) !== abbreviation.charAt(abbreviationIndex)) {
        score *= PENALTY_CASE_MISMATCH
      }
    }

    if (
      (score < SCORE_TRANSPOSITION &&
        lowerString.charAt(index - 1) === lowerAbbreviation.charAt(abbreviationIndex + 1)) ||
      (lowerAbbreviation.charAt(abbreviationIndex + 1) ===
        lowerAbbreviation.charAt(abbreviationIndex) &&
        lowerString.charAt(index - 1) !== lowerAbbreviation.charAt(abbreviationIndex))
    ) {
      const transposedScore = scoreInner(
        string,
        abbreviation,
        lowerString,
        lowerAbbreviation,
        index + 1,
        abbreviationIndex + 2,
        memo
      )
      if (transposedScore * SCORE_TRANSPOSITION > score) {
        score = transposedScore * SCORE_TRANSPOSITION
      }
    }

    if (score > highScore) highScore = score
    index = lowerString.indexOf(abbreviationChar, index + 1)
  }

  memo[memoKey] = highScore
  return highScore
}

const normalize = (str: string) => str.toLowerCase().replace(/[\s-]/g, ' ')

export function commandScore(string: string, abbreviation: string): number {
  return scoreInner(string, abbreviation, normalize(string), normalize(abbreviation), 0, 0, {})
}
