export class ApplicationError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message)
  }
}

export class UserError extends ApplicationError {}
