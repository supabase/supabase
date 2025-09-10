import { GuideModel, SubsectionModel } from '../../../resources/guide/guideModel.js'
import { GuideModelLoader } from '../../../resources/guide/guideModelLoader.js'
import { BaseLoader, BaseSource } from './base.js'

export class MarkdownLoader extends BaseLoader {
  type = 'markdown' as const

  constructor(
    source: string,
    public filePath: string,
    public options?: { yaml?: boolean }
  ) {
    const path = filePath.replace(/^(pages|content)/, '').replace(/\.mdx?$/, '')
    super(source, path)
  }

  async load() {
    const guide = (
      await GuideModelLoader.fromFs(this.filePath.replace(/^content\/guides/, ''))
    ).unwrap()
    return [
      new MarkdownSource(
        this.source,
        this.path,
        guide.content ?? '',
        {
          checksum: guide.checksum,
          meta: guide.metadata,
          sections: guide.subsections,
        },
        this.options
      ),
    ]
  }

  static fromGuideModel(source: string, guide: GuideModel): MarkdownSource {
    const path = guide.href ? guide.href.replace('https://supabase.com/docs', '') : ''

    return new MarkdownSource(source, path, guide.content ?? '', {
      checksum: guide.checksum,
      meta: guide.metadata,
      sections: guide.subsections,
    })
  }
}

export class MarkdownSource extends BaseSource {
  type = 'markdown' as const

  constructor(
    source: string,
    path: string,
    public contents: string,
    {
      checksum,
      meta,
      sections,
    }: { checksum?: string; meta?: Record<string, unknown>; sections: Array<SubsectionModel> },
    public options?: { yaml?: boolean }
  ) {
    super(source, path)
    this.checksum = checksum
    this.meta = meta ?? {}
    this.sections = sections.map((section) => ({
      content: section.content ?? '',
      heading: section.title,
      slug: section.href,
    }))
  }

  async process() {
    return {
      checksum: this.checksum ?? '',
      meta: this.meta,
      sections: this.sections ?? [],
    }
  }

  extractIndexedContent(): string {
    const sections = this.sections ?? []
    const sectionText = sections.map(({ content }) => content).join('\n\n')

    return `# ${this.meta?.title ?? ''}\n\n${this.meta?.subtitle ?? ''}\n\n${sectionText}`
  }
}
