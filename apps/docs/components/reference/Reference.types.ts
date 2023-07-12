import { enrichedOperation } from '~/lib/refGenerator/helpers'

export interface ISpec {
  openref: any
  info: {
    id: string
    title: string
    description: string
    definition: string
    libraries: any
    slugPrefix: string
    specUrl: string
  }
  functions: IFunctionDefinition[]
}

export interface IAPISpec {
  info: {
    title: string
    description?: string
    version: string
    contact?: {}
  }
  operations: enrichedOperation[]
  sections: any
}

export interface IFunctionDefinition {
  title: string
  id: string
  $ref: string
  description: string
  examples?: []
}

export interface ICommonBase {
  type: string
  title: string
  summary?: string
}

export interface ICommonBaseSection extends ICommonBase {
  id: string
  slug: string
  excludes?: string[]
}

export interface ICommonCategory extends ICommonBase {
  type: 'category'
  items: ICommonSection[]
  excludes?: string[]
}

export interface ICommonMarkdown extends ICommonBaseSection {
  type: 'markdown'
}

export interface ICommonFunctionGroup extends ICommonBaseSection {
  type: 'function'
  isFunc: false
  product: string
  items: ICommonFunction[]
}

export interface ICommonFunction extends ICommonBaseSection {
  type: 'function'
  product: string
  parent?: string
}

export interface ICommonCliCommand extends ICommonBaseSection {
  type: 'cli-command'
}

export interface ICommonApiOperation extends ICommonBaseSection {
  type: 'operation'
}

export type ICommonSection =
  | ICommonMarkdown
  | ICommonFunctionGroup
  | ICommonFunction
  | ICommonCliCommand
  | ICommonApiOperation

export type ICommonItem = ICommonCategory | ICommonSection

export interface IRefFunctionSection {
  funcData: any
  commonFuncData: ICommonFunction
  spec: any
  typeSpec?: TypeSpec
}

export interface IRefStaticDoc {
  id: string
  title: string
  meta: {
    id: string
    title: string
    hideTitle: boolean
  }
  content: {
    compiledSource: string
    frontmatter: {}
    scope: {}
  }
}

export type TypeSpec = {
  name: string
  children: TypeSpecChild[]
}

export type TypeSpecChild = {
  id: number
  name: string
  kind: number
  kindString?: string
  flags?: {}
  originalName?: string
  children?: TypeSpecChild[]
  defaultValue?: string
  default?: any
  groups?: any
  sources?: any
  target?: any
  comment?: TypeSpecChildComment
  typeParameter?: any
  implementedTypes?: any
  extendedTypes?: any
  dereferenced?: TypeSpecChild
  extendedBy?: any
  indexSignature?: any
  extendsType?: any
  objectType?: any
  trueType?: any
  falseType?: any
  type?: any
  signatures?: any
  overwrites?: any
  inheritedFrom?: any
  implementationOf?: any
}

export interface TypeSpecChildComment {
  shortText?: string
  text?: string | null
  returns?: string | null
  tags?: any
}
