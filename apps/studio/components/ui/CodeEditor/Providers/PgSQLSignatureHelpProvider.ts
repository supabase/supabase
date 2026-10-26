import type { Monaco } from '@monaco-editor/react'
import type { editor, Position } from 'monaco-editor'
import type { RefObject } from 'react'

import BackwardIterator from './BackwardIterator'
import type { PgInfo } from './Providers.types'

export function getPgsqlSignatureHelpProvider(
  _monaco: Monaco,
  pgInfoRef: RefObject<PgInfo | null>
) {
  return {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp: function (model: editor.ITextModel, position: Position) {
      const pgInfo = pgInfoRef.current
      if (!pgInfo) return null

      // position.column should minus 2 as it returns 2 for first char
      // position.lineNumber should minus 1
      const iterator = new BackwardIterator(model, position.column - 2, position.lineNumber - 1)

      let paramCount = iterator.readArguments()
      if (paramCount < 0) return null

      let ident = iterator.readIdent()
      if (!ident || ident.match(/^\".*?\"$/)) return null

      let fn = pgInfo.functions.find(
        (f) => f.name.toLocaleLowerCase() === ident.toLocaleLowerCase()
      )
      if (!fn) return null
      if (!fn.args || fn.args.length < paramCount) return null

      const activeSignature = 0
      const activeParameter = Math.min(paramCount, fn.args.length - 1)
      const signatures = []
      signatures.push({
        label: `${fn.name}(${fn.argument_types})`,
        parameters: fn.args.map((v) => {
          return { label: v.name }
        }),
      })

      return { value: { signatures, activeSignature, activeParameter }, dispose: () => {} }
    },
  }
}
