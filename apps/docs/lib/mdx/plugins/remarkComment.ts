import { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'
import { Options as ToMarkdownExtension } from 'mdast-util-to-markdown'
import { codes } from 'micromark-util-symbol/codes.js'
import { types } from 'micromark-util-symbol/types.js'
import { HtmlExtension, Extension as MicromarkExtension, Tokenizer } from 'micromark-util-types'
import { Plugin } from 'unified'

declare module 'micromark-util-types' {
  export interface TokenTypeMap {
    comment: 'comment'
  }
}

declare module 'mdast' {
  interface BlockContentMap {
    comment: CommentElement
  }
}

declare module 'mdast-util-to-markdown' {
  interface ConstructNameMap {
    comment: 'comment'
  }
}

export type CommentElement = {
  type: 'comment'
  value: string
  commentValue: string
}

export type RemarkCommentOptions = {
  ast?: boolean
}

export function commentFromMarkdown(options: RemarkCommentOptions): FromMarkdownExtension {
  return {
    canContainEols: ['comment'],
    enter: {
      comment() {
        this.buffer()
      },
    },
    exit: {
      comment(token) {
        const text = this.resume()
        if (options?.ast) {
          this.enter(
            {
              type: 'comment',
              value: '',
              commentValue: text.slice(0, -2),
            },
            token
          )
          this.exit(token)
        }
      },
    },
  }
}

export const commentToMarkdown: ToMarkdownExtension = {
  handlers: {
    comment(node) {
      return `<!--${node.commentValue.replace(/(?<=--)>/g, '\\>')}-->`
    },
  },
}

export const commentHtml: HtmlExtension = {
  enter: {
    comment() {
      this.buffer()
    },
  },
  exit: {
    comment() {
      this.resume()
      this.setData('slurpOneLineEnding', true)
    },
  },
}

const tokenize: Tokenizer = function (effects, ok, nok) {
  return start

  function start(code) {
    effects.enter('comment')
    effects.consume(code)
    return open
  }

  function open(code) {
    if (code === codes.exclamationMark) {
      effects.consume(code)
      return declarationOpen
    }

    return nok(code)
  }

  function declarationOpen(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentOpen
    }

    return nok(code)
  }

  function commentOpen(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentStart
    }

    return nok(code)
  }

  function commentStart(code) {
    if (code === codes.greaterThan) {
      return nok(code)
    }

    effects.enter(types.data)

    if (code === codes.dash) {
      effects.consume(code)
      return commentStartDash
    }

    return comment(code)
  }

  function commentStartDash(code) {
    if (code === codes.greaterThan) {
      return nok(code)
    }

    return comment(code)
  }

  function comment(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentClose
    }

    effects.consume(code)
    return comment
  }

  function commentClose(code) {
    if (code === codes.dash) {
      effects.consume(code)
      return end
    }

    return comment(code)
  }

  function end(code) {
    if (code === codes.greaterThan) {
      effects.exit(types.data)
      effects.consume(code)
      effects.exit('comment')
      return ok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return end
    }

    return comment(code)
  }
}

export const comment: MicromarkExtension = {
  flow: { [codes.lessThan]: { tokenize, concrete: true } },
  text: { [codes.lessThan]: { tokenize } },
}

/**
 * Parses HTML style comments as a different node type so it
 * can be ignored during MDX serialization.
 * ---
 * _Copied from https://github.com/leebyron/remark-comment and
 * modified to support multiline comments._
 *
 * _TODO: upstream the changes_
 */
const remarkComment: Plugin = function (options: RemarkCommentOptions) {
  const data: Record<string, any> = this.data()
  const add = (field, value) => (data[field] ? data[field] : (data[field] = [])).push(value)

  add('micromarkExtensions', comment)
  add('htmlExtensions', commentHtml)
  add('fromMarkdownExtensions', commentFromMarkdown(options))
  add('toMarkdownExtensions', commentToMarkdown)
}

export default remarkComment
