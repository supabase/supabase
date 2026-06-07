import type { Section } from '../../helpers.mdx.js'

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
  meta?: Record<string, unknown>
  sections?: Section[]

  constructor(
    public source: string,
    public path: string
  ) {}

  abstract process(): Promise<{
    checksum: string
    meta?: Record<string, unknown>
    ragIgnore?: boolean
    sections: Section[]
  }>

  abstract extractIndexedContent(): string
}
