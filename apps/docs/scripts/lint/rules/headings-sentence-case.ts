import { Node } from 'unist'
import { capitalizedWords } from '../config/exceptions/capitalizedWords'
import { ErrorSeverity, FixReplace, LintError, LintRule, error } from './rules'
import { symbolRegex, tokenize } from '../utils/text'
import { visit } from 'unist-util-visit'
import { Heading } from 'mdast'
import { countWords } from '../utils/words'

function isFirstOfTheLine(_: Node, index: number, parent: Node, ancestor: Node) {
  if (index !== 0) return false

  let curr = ancestor
  do {
    if (curr === parent) return true

    curr = 'children' in curr ? curr.children?.[0] : null
  } while (curr)

  return false
}

function headingsSentenceCaseCheck(headingNode: Heading, _: number, __: Node, file: string) {
  const errors: LintError[] = []

  visit(headingNode, 'text', function lint(textNode, textNodeIndex, textNodeParent) {
    const isFirstNodeOfHeading = isFirstOfTheLine(
      textNode,
      textNodeIndex,
      textNodeParent,
      headingNode
    )

    const text = textNode.value
    const tokens = tokenize(text, { exceptions: [capitalizedWords] })

    tokens.forEach((token, index, tokens) => {
      if (symbolRegex.test(token.value)) {
        return
      }

      // Token can only be multiple words long if it has already matched the exception list
      if (countWords(token.value) > 1) {
        return
      }

      // Error if first token of first word starts with lowercase letter
      if (isFirstNodeOfHeading && index === 0 && /[a-z]/.test(token.value[0])) {
        errors.push(
          error({
            message: 'First word in heading should be capitalized.',
            severity: ErrorSeverity.Error,
            file,
            line: textNode.position.start.line,
            column: textNode.position.start.column + token.positionInParent.columnZeroIndexed,
            fix: new FixReplace({
              start: {
                line: textNode.position.start.line,
                column: textNode.position.start.column + token.positionInParent.columnZeroIndexed,
              },
              end: {
                line: textNode.position.start.line,
                column:
                  textNode.position.start.column + token.positionInParent.columnZeroIndexed + 1,
              },
              text: token.value[0].toUpperCase(),
            }),
          })
        )
        return
      }

      // Error if first word after colon starts with lowercase letter
      if (index !== 0 && tokens[index - 1].value.endsWith(':') && /[a-z]/.test(token.value[0])) {
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
                column: textNode.position.start.column + token.positionInParent.columnZeroIndexed,
              },
              end: {
                line: textNode.position.start.line,
                column:
                  textNode.position.start.column + token.positionInParent.columnZeroIndexed + 1,
              },
              text: token.value[0].toUpperCase(),
            }),
          })
        )
        return
      }

      // Error if any other token starts with lowercase letter
      // Exception: if the preceding token is a symbol
      if (
        // Token is not first word of heading
        !(isFirstNodeOfHeading && index === 0) &&
        // Preceding token (if exists) is not a symbol
        (index === 0 || !symbolRegex.test(tokens[index - 1].value)) &&
        // Token is capitalized
        /[A-Z]/.test(token.value[0]) &&
        // Token doesn't match exception list
        !token.matchedException
      ) {
        errors.push(
          error({
            message: 'Heading should be in sentence case.',
            severity: ErrorSeverity.Error,
            file,
            line: textNode.position.start.line,
            column: textNode.position.start.column + token.positionInParent.columnZeroIndexed,
            fix: new FixReplace({
              start: {
                line: textNode.position.start.line,
                column: textNode.position.start.column + token.positionInParent.columnZeroIndexed,
              },
              end: {
                line: textNode.position.start.line,
                column:
                  textNode.position.start.column + token.positionInParent.columnZeroIndexed + 1,
              },
              text: token.value[0].toLowerCase(),
            }),
          })
        )
      }
    })
  })

  return errors
}

export function headingsSentenceCase() {
  return new LintRule({
    check: headingsSentenceCaseCheck,
    nodeTypes: 'heading',
    id: 'headings-sentence-case',
  })
}
