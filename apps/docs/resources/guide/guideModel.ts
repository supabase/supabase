import { type SearchResultInterface } from '../globalSearch/globalSearchInterface'

export class GuideModel implements SearchResultInterface {
  public title?: string
  public href?: string
  public content?: string
  public subsections: Array<SubsectionModel>

  constructor({
    title,
    href,
    content,
    subsections,
  }: {
    title?: string
    href?: string
    content?: string
    subsections?: Array<{ title?: string; href?: string; content?: string }>
  }) {
    this.title = title
    this.href = href
    this.content = content
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
