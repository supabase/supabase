import { SpecLink } from './Spec'
import { Url } from 'url'

export type SdkInfo = {
  id: string
  version: string
  title: string
  language: string
  source: Url
  bugs: Url
  spec: Url
  description: string
  options: string
}

export type SdkType = {
  id: string
  title: string
  summary: string
  source: Url
  value: string
  ref?: SdkType
  links: SpecLink[]
}

export type FunctionAttribute = {
  id: string
  title: string
  required: boolean
  description: string
  type?: string[]
  ref?: string // If a "type" is not supplied, a "ref" must be. This is a pointer to a type.
  children: FunctionAttribute[]
}

export type FunctionReturn = {
  id: string
  title: string
  value: string
  description: string
  ref?: string // This is a pointer to a type.
}

export type FunctionExample = {
  id: string
  title: string
  description?: string
  links: SpecLink[]
  code: string
  returns?: FunctionReturn
}

export type Function = {
  id: string
  title: string
  summary: string
  source: Url
  description?: string
  usage: string
  tags: string[]
  links: SpecLink[]
  attributes?: FunctionAttribute[]
  returns?: FunctionReturn[]
  examples?: FunctionExample[]
}

export interface SdkSpec {
  sdkspec: '001'

  info: SdkInfo

  functions: Function[]

  types: SdkType[]
}
