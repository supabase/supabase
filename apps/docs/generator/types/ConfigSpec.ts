import { SpecLink } from './Spec'
import { Url } from 'url'

export type Tag = {
  id: string
  title: string
  description?: string
}

export type ConfigInfo = {
  id: string
  version: string
  title: string
  source: Url
  bugs: Url
  spec: Url
  description: string
  tags: Tag[]
}

export type ConfigParameter = {
  id: string
  title: string
  tags: string[]
  required: boolean
  description: string
  links: SpecLink[]
}

export interface ConfigSpec {
  configspec: '001'

  info: ConfigInfo

  parameters: ConfigParameter[]
}
