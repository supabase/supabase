import type { Json, Section } from '../../helpers.mdx.js'

export abstract class BaseLoader {
  type: string

  constructor(
    public source: string,
    public path: string
  ) {}

  abstract load(): Promise<BaseSource[]>
}

export abstract class BaseSource {
  type: string
  checksum?: string
  meta?: Json
  sections?: Section[]

  constructor(
    public source: string,
    public path: string
  ) {}

  abstract process(): { checksum: string; meta?: Json; ragIgnore?: boolean; sections: Section[] }

  abstract extractIndexedContent(): string
}
