/**
 * The SQL text of one query tab plus a revision that advances on every change,
 * including an edit followed by a revert. Agent edits pass the revision they
 * read so they never overwrite a change the user made in the meantime.
 */
export class QueryDraftState {
  revision = 0

  constructor(public sql: string) {}

  change(sql: string, expectedRevision?: number) {
    if (expectedRevision !== undefined && expectedRevision !== this.revision) {
      throw new Error(
        'The query changed since it was read. Read the workspace again before proposing another edit.'
      )
    }
    if (this.sql !== sql) {
      this.sql = sql
      this.revision++
    }
    return { sql: this.sql, revision: this.revision }
  }
}
