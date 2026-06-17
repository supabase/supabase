import type { SearchQuery } from '../operations/search'
import type { Template, TemplateSummary } from '../schema'

/**
 * Primary public abstraction for accessing templates. All consumers (composer,
 * CLI, docs, marketplace page, third parties) construct a source and call
 * `list()` / `get()` rather than reaching into the embedded bundle directly.
 *
 * `list()` returns lightweight summaries (no file contents) so browse-style UIs
 * can render hundreds of templates cheaply. `get(id)` returns the full payload
 * with files and readme; this is what composer needs when a template is
 * actually selected, and what the CLI needs when it actually installs.
 */
export interface TemplateSource {
  list(): Promise<TemplateSummary[]>
  get(id: string, version?: string): Promise<Template>
  /**
   * Optional. Sources that can do server-side search (e.g. an HTTP marketplace)
   * implement this. Falls back to client-side filtering on `list()` results when
   * absent.
   */
  search?(query: SearchQuery): Promise<TemplateSummary[]>
}
