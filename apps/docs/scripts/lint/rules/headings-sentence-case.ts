import { Content, Text } from 'mdast'
import { stripSymbols } from '../utils/words'
import { capitalizedWords } from '../config/words'
import { ErrorSeverity, LintRule, error, success } from '.'

export function headingsSentenceCaseCheck(node: Content) {
  if (!('children' in node)) {
    return success()
  }

  let text = (node.children.find((child) => child.type === 'text') as Text).value

  if (!text) {
    return success()
  }

  let errorLevel: ErrorSeverity | null = null
  let errorMessage: string | null = null

  const words = text.split(/s+/)

  for (let i = 0; i < words.length; i++) {
    const word = stripSymbols(words[i])
    if (!word) {
      continue
    }

    if (i === 0) {
      if (/[a-z]/.test(word[0])) {
        errorLevel = 'error'
        errorMessage = 'First word in heading should be capitalized.'
      }
      continue
    }

    if (/[A-Z]/.test(word[0]) && !capitalizedWords.has(word)) {
      errorLevel = 'error'
      errorMessage = 'Heading should be in sentence case.'
      break
    }
  }

  return errorLevel ? error(errorMessage, errorLevel) : success()
}

export const headingSentenceCase = new LintRule({
  check: headingsSentenceCaseCheck,
  nodeTypes: 'heading',
})
