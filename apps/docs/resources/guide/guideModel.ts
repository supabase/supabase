import { SearchResultModel } from '../globalSearch/globalSearchModel'

export class GuideModel implements SearchResultModel {
  public id: string
  public title?: string
  public href?: string
  // public description?: string
  public content?: string
  public subsections: Array<SubsectionModel>

  constructor({
    id,
    title,
    href,
    // description,
    content,
    subsections,
  }: {
    id: string
    title?: string
    href?: string
    // description?: string
    content?: string
    subsections?: Array<{ title?: string; href?: string; content?: string }>
  }) {
    this.id = id
    this.title = title
    this.href = href
    // this.description = description
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
