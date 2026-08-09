export class EmailTemplateError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = "EmailTemplateError";
    this.code = code;
    this.details = details;
  }
}
