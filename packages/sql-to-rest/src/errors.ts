export class ParsingError extends Error {
  name = 'ParsingError'

  constructor(message: string) {
    super(sentenceCase(message))
  }
}

export class UnimplementedError extends Error {
  name = 'UnimplementedError'
}

export class UnsupportedError extends Error {
  name = 'UnsupportedError'

  constructor(
    message: string,
    public hint?: string
  ) {
    super(message)
  }
}

export class RenderError extends Error {
  name = 'RenderError'

  constructor(
    message: string,
    public renderer: 'http' | 'supabase-js'
  ) {
    super(message)
  }
}

export function sentenceCase(value: string) {
  return value[0].toUpperCase() + value.slice(1)
}
