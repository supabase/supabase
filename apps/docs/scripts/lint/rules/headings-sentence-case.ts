import { Content, Text } from 'mdast'
import { stripSymbols } from '../utils/words'
import { capitalizedWords } from '../config/words'
import { ErrorSeverity, FixReplace, LintError, LintRule, error } from '.'

function headingsSentenceCaseCheck(node: Content, file: string) {
  if (!('children' in node)) {
    return []
  }

  const textNode = node.children.find((child) => child.type === 'text') as Text
  if (!textNode) {
    return []
  }
  const text = textNode.value

  const words = text.split(/s+/)
  const errors: LintError[] = []

  for (let i = 0; i < words.length; i++) {
    const word = stripSymbols(words[i])
    if (!word) {
      continue
    }

    if (i === 0) {
      if (/[a-z]/.test(word[0])) {
        errors.push(
          error({
            message: 'First word in heading should be capitalized.',
            severity: ErrorSeverity.Error,
            file,
            line: node.position.start.line,
            column: node.position.start.column,
            fix: new FixReplace({
              start: {
                lineOffset: 0,
                column: node.position.start.column,
              },
              end: {
                lineOffset: 0,
                column: node.position.start.column + 1,
              },
              text: word[0].toUpperCase(),
            }),
          })
        )
      }
      continue
    }

    if (/[A-Z]/.test(word[0]) && !capitalizedWords.has(word)) {
      errors.push(
        error({
          message: 'Heading should be in sentence case.',
          severity: ErrorSeverity.Error,
          file,
          line: node.position.start.line,
          column: node.position.start.column,
          fix: new FixReplace({
            start: {
              lineOffset: 0,
              column: node.position.start.column,
            },
            end: {
              lineOffset: 0,
              column: node.position.start.column + 1,
            },
            text: word[0].toUpperCase(),
          }),
        })
      )
      break
    }
  }

  return errors
}

export function headingsSentenceCase() {
  return new LintRule({
    check: headingsSentenceCaseCheck,
    nodeTypes: 'heading',
  })
}
