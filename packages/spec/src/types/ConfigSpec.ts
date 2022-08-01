import { SpecLink } from './Spec'
import { Url } from 'url'

export type ConfigInfo = {
  id: string
  version: string
  title: string
  source: Url
  bugs: Url
  spec: Url
  description: string
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
