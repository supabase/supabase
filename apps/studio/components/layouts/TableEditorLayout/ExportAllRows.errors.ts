const normalizeCauseAsError = (cause: unknown): Error | undefined => {
  if (!cause) return undefined

  if (cause instanceof Error) {
    return cause
  }

  if (typeof cause === 'object' && 'message' in cause) {
    return new Error(String(cause.message))
  }

  return new Error(String(cause))
}

export class ExportAllRowsErrorFamily extends Error {
  cause?: Error

  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, options)
  }
}

export class NoConnectionStringError extends ExportAllRowsErrorFamily {
  constructor() {
    super('No connection string provided for database connection.')
    this.name = 'NoConnectionStringError'
  }
}

export class TableDetailsFetchError extends ExportAllRowsErrorFamily {
  constructor(tableName: string, _cause?: unknown) {
    const cause = normalizeCauseAsError(_cause)
    super(`Failed to fetch table details from the database for table ${tableName}.`, { cause })
    this.name = 'TableDetailsFetchError'
  }
}

export class NoTableError extends ExportAllRowsErrorFamily {
  constructor(tableName: string) {
    super(`The specified table "${tableName}" does not exist in the database.`)
    this.name = 'NoTableError'
  }
}

export class NoRowsToExportError extends ExportAllRowsErrorFamily {
  constructor(tableName: string) {
    super(`There are no rows to export from the table "${tableName}".`)
    this.name = 'NoRowsToExportError'
  }
}

export class TableTooLargeError extends ExportAllRowsErrorFamily {
  constructor(tableName: string, rowCount: number, maxAllowed: number) {
    super(
      `The table "${tableName}" has ${rowCount} rows, which exceeds the maximum allowed limit of ${maxAllowed} rows for export.`
    )
    this.name = 'TableTooLargeError'
  }
}

export class FetchRowsError extends ExportAllRowsErrorFamily {
  constructor(tableName: string, _cause?: unknown) {
    const cause = normalizeCauseAsError(_cause)
    super(`An error occurred while fetching rows from the table "${tableName}".`, { cause })
    this.name = 'FetchRowsError'
  }
}

export class OutputConversionError extends ExportAllRowsErrorFamily {
  constructor(_cause?: unknown) {
    const cause = normalizeCauseAsError(_cause)
    super('Failed to convert the fetched rows into the desired output format.', {
      cause,
    })
    this.name = 'OutputConversionError'
  }
}

export class BlobCreationError extends ExportAllRowsErrorFamily {
  constructor(_cause?: unknown) {
    const cause = normalizeCauseAsError(_cause)
    super('An error occurred while creating a Blob for the exported data.', { cause })
    this.name = 'BlobCreationError'
  }
}

export class DownloadSaveError extends ExportAllRowsErrorFamily {
  constructor(_cause?: unknown) {
    const cause = normalizeCauseAsError(_cause)
    super('An error occurred while saving the exported data to a file.', { cause })
    this.name = 'DownloadSaveError'
  }
}
