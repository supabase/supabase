import { Content } from 'mdast'
import { Node } from 'unist'
import { capitalizedWords } from '../config/words'
import { ErrorSeverity, FixReplace, LintError, LintRule, error } from '.'

function headingsSentenceCaseCheck(node: Content, _: number, __: Node, file: string) {
  if (!('children' in node)) {
    return []
  }

  const textNode = node.children[0]
  // need to account for `inlineCode` children, in initial, middle, and final positions
  // need to account for headings beginning with number
  // investigate why JSON Web Token at beginning isn't working
  if (textNode?.type !== 'text') {
    return []
  }
  const text = textNode.value

  const errors: LintError[] = []

  const wordRegex = /\b\S+\b/g

  const firstMatch = wordRegex.exec(text)
  const firstWord = firstMatch?.[0]
  if (
    capitalizedWords.matchException({
      word: firstWord,
      fullString: text,
      index: firstMatch.index,
    }).exception
  ) {
    wordRegex.lastIndex += capitalizedWords.matchException({
      word: firstWord,
      fullString: text,
      index: wordRegex.lastIndex,
    }).advanceIndexBy
  } else if (firstWord?.[0] && /[a-z]/.test(firstWord[0])) {
    errors.push(
      error({
        message: 'First word in heading should be capitalized.',
        severity: ErrorSeverity.Error,
        file,
        line: textNode.position.start.line,
        column: textNode.position.start.column,
        fix: new FixReplace({
          start: {
            line: textNode.position.start.line,
            column: textNode.position.start.column,
          },
          end: {
            line: textNode.position.start.line,
            column: textNode.position.start.column + 1,
          },
          text: firstWord[0].toUpperCase(),
        }),
      })
    )
  }

  let currMatch: RegExpExecArray
  while ((currMatch = wordRegex.exec(text)) !== null) {
    const currWord = currMatch[0]
    const index = textNode.position.start.column + currMatch.index

    if (text[currMatch.index - 2] === ':') {
      if (currWord[0] && /[a-z]/.test(currWord[0])) {
        errors.push(
          error({
            message: 'First word after colon should be capitalized.',
            severity: ErrorSeverity.Error,
            file,
            line: textNode.position.start.line,
            column: textNode.position.start.column,
            fix: new FixReplace({
              start: {
                line: textNode.position.start.line,
                column: textNode.position.start.column,
              },
              end: {
                line: textNode.position.start.line,
                column: textNode.position.start.column + 1,
              },
              text: firstWord[0].toUpperCase(),
            }),
          })
        )
      }
    } else if (
      /[A-Z]/.test(currWord[0]) &&
      /[a-z]/.test(currWord) &&
      capitalizedWords.matchException({
        word: currWord,
        fullString: text,
        index: currMatch.index,
      }).exception
    ) {
      wordRegex.lastIndex += capitalizedWords.matchException({
        word: currWord,
        fullString: text,
        index: currMatch.index,
      }).advanceIndexBy
    } else if (
      /[A-Z]/.test(currWord[0]) &&
      /[a-z]/.test(currWord) &&
      !capitalizedWords.matchException({
        word: currWord,
        fullString: text,
        index: currMatch.index,
      }).exception
    ) {
      errors.push(
        error({
          message: 'Heading should be in sentence case.',
          severity: ErrorSeverity.Error,
          file,
          line: textNode.position.start.line,
          column: textNode.position.start.column,
          fix: new FixReplace({
            start: {
              line: textNode.position.start.line,
              column: index,
            },
            end: {
              line: textNode.position.start.line,
              column: index + 1,
            },
            text: currWord[0].toLowerCase(),
          }),
        })
      )
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
