import { Content } from 'mdast'

export enum ErrorSeverity {
  Error = 1,
  Warning,
  Suggestion,
}

interface Position {
  line: number
  column: number
}

abstract class LintFix {
  constructor() {}

  abstract fix(filePath: string, fileContents: string[]): void
}

export class FixDelete extends LintFix {
  start: Position
  end: Position

  constructor({ start, end }: { start: Position; end: Position }) {
    super()
    this.start = start
    this.end = end
  }

  fix(filePath: string, fileContents: string[]) {
    throw Error('delete fix not implemented')
  }
}

export class FixInsert extends LintFix {
  start: Position
  text: string

  constructor({ start, text }: { start: Position; text: string }) {
    super()
    this.start = start
    this.text = text
  }

  fix(filePath: string, fileContents: string[]) {
    throw Error('insert fix not implemented')
  }
}

export class FixReplace extends LintFix {
  start: Position
  end: Position
  text: string

  constructor({ start, end, text }: { start: Position; end: Position; text: string }) {
    super()
    this.start = start
    this.end = end
    this.text = text
  }

  fix(filePath: string, fileContents: string[]) {
    // Line and column numbers are 1-indexed, so everything must be shifted by 1
    // when accessing `fileContents`
    fileContents[this.start.line - 1] =
      fileContents[this.start.line - 1].substring(0, this.start.column - 1) +
      this.text +
      fileContents[this.end.line - 1].substring(this.end.column - 1)
  }
}

export interface LintError {
  error: true
  severity: ErrorSeverity
  message: string
  location: {
    file: string
    line: number
    column: number
  }
  fix?: LintFix
}

type Check = (content: Content, file: string) => LintError[]

export function error({
  message,
  severity = ErrorSeverity.Warning,
  file,
  line,
  column,
  fix,
}: {
  message: string
  severity?: ErrorSeverity
  file: string
  line: number
  column: number
  fix?: LintFix
}): LintError {
  return {
    error: true,
    severity: severity ?? ErrorSeverity.Warning,
    message,
    location: {
      file,
      line,
      column,
    },
    ...(fix ? { fix } : {}),
  }
}

export class LintRule {
  readonly nodeTypes: Content['type'][]
  private check: Check

  constructor({
    check,
    nodeTypes,
  }: {
    check: Check
    nodeTypes: Content['type'][] | Content['type']
  }) {
    this.check = check
    this.nodeTypes = Array.isArray(nodeTypes) ? nodeTypes : [nodeTypes]
  }

  runRule(content: Content, file: string) {
    return this.check(content, file)
  }
}
