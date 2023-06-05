export type Json = Record<
  string,
  string | number | boolean | null | Json[] | { [key: string]: Json }
>

export type Section = {
  content: string
  heading?: string
  slug?: string
}

export abstract class BaseSource {
  checksum?: string
  meta?: Json
  sections?: Section[]

  constructor(public source: string, public path: string, public parentPath?: string) {}

  abstract load(): Promise<{ checksum: string; meta?: Json; sections: Section[] }>
}
