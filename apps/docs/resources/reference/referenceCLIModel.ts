import { Json } from 'common'
import { isPlainObject } from '~/features/helpers.misc'
import { type SearchResultInterface } from '../globalSearch/globalSearchInterface'

export const DB_METADATA_TAG_PLATFORM_CLI = 'cli'

export class ReferenceCLICommandModel implements SearchResultInterface {
  public title?: string
  public href?: string
  public content?: string

  constructor({
    title,
    href,
    content,
    subsections,
  }: {
    title?: string
    href?: string
    content?: string
    subsections?: Array<Json>
  }) {
    this.title = title
    this.href = href
    this.content =
      content +
      '\n\n' +
      subsections
        ?.map((subsection) => (isPlainObject(subsection) && subsection.content) || '')
        .join('\n\n')
  }
}
