export namespace TsDoc {
  export type DocComment = {
    shortText?: string
    text?: string
    tags?: CommentTag[]
  }
  export type CommentTag = {
    tag: 'param' | 'returns'
    text: string
    param: string
  }

  export type TypeDefinition = {
    id: string
    name: string
    kind: number
    kindString: 'Parameter' | 'Method'
    comment?: CommentTag
    flags: { isExported: boolean; isOptional?: boolean }
    type: { type: string; name: string; declaration: TypeDefinition }
    children: TypeDefinition[]
  }
}

export namespace OpenRef {
  export type Page = {
    pageName: string
    title?: string
    description?: string
    notes?: string
    id: string
    // $ref?: string // reference to a TSDoc node
  }
}
