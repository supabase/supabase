export class ApplicationError extends Error {
  constructor(
    message: string,
    public data: Record<string, any> = {}
  ) {
    super(message)
  }
}

export class ContextLengthError extends ApplicationError {
  constructor() {
    super('LLM context length exceeded')
  }
}

export class EmptyResponseError extends ApplicationError {
  constructor() {
    super('LLM API response succeeded but returned nothing')
  }
}

export class EmptySqlError extends ApplicationError {
  constructor() {
    super('LLM did not generate any SQL')
  }
}

export class UserError extends ApplicationError {}
