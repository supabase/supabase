import { Content } from 'mdast'

export enum ErrorSeverity {
  Error = 1,
  Warning,
  Suggestion,
}

interface RelativePosition {
  lineOffset: number
  column: number
}

type RelativePositionParams = Partial<RelativePosition> & Pick<RelativePosition, 'column'>

function relPosition(column: number, lineOffset?: number): RelativePosition {
  return {
    lineOffset: lineOffset ?? 0,
    column,
  }
}

abstract class LintFix {
  constructor() {}

  abstract fix(filePath: string, fileContents: string): void
}

export class FixDelete extends LintFix {
  start: RelativePosition
  end: RelativePosition

  constructor({ start, end }: { start: RelativePositionParams; end: RelativePositionParams }) {
    super()
    this.start = relPosition(start.column, start.lineOffset)
    this.end = relPosition(end.column, end.lineOffset)
  }

  fix(filePath: string, fileContents: string) {}
}

export class FixInsert extends LintFix {
  start: RelativePosition
  text: string

  constructor({ start, text }: { start: RelativePositionParams; text: string }) {
    super()
    this.start = relPosition(start.column, start.lineOffset)
    this.text = text
  }

  fix(filePath: string, fileContents: string) {}
}

export class FixReplace extends LintFix {
  start: RelativePosition
  end: RelativePosition
  text: string

  constructor({
    start,
    end,
    text,
  }: {
    start: RelativePositionParams
    end: RelativePositionParams
    text: string
  }) {
    super()
    this.start = relPosition(start.column, start.lineOffset)
    this.end = relPosition(end.column, end.lineOffset)
    this.text = text
  }

  fix(filePath: string, fileContents: string) {}
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
