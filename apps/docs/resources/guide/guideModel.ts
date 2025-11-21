import { type SearchResultInterface } from '../globalSearch/globalSearchInterface'

export class GuideModel implements SearchResultInterface {
  public title?: string
  public href?: string
  public checksum?: string
  public content?: string
  public metadata?: Record<string, unknown>
  public subsections: Array<SubsectionModel>

  constructor({
    title,
    href,
    checksum,
    content,
    metadata,
    subsections,
  }: {
    title?: string
    href?: string
    checksum?: string
    content?: string
    metadata?: Record<string, unknown>
    subsections?: Array<{ title?: string; href?: string; content?: string }>
  }) {
    this.title = title
    this.href = href
    this.checksum = checksum
    this.content = content
    this.metadata = metadata
    this.subsections = subsections?.map((subsection) => new SubsectionModel(subsection)) ?? []
  }
}

export class SubsectionModel {
  public title?: string
  public href?: string
  public content?: string

  constructor({ title, href, content }: { title?: string; href?: string; content?: string }) {
    this.title = title
    this.href = href
    this.content = content
  }
}
