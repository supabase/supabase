import { TsDoc } from '../definitions'

const fs = require('fs')

/**
 * tsDocCommentToMdParams()
 */
export const tsDocCommentToMdParams = (tags: TsDoc.CommentTag[]) =>
  tags
    .filter((x) => x.tag == 'param')
    .map((x) =>
      `
tag

`.trim()
    )
    .join('\n')

/**
 * tsDocCommentToMarkdown()
 */
export const tsDocCommentToMdComment = (commentObject: TsDoc.DocComment) =>
  `
${commentObject?.shortText || ''}

${commentObject?.text || ''}

`.trim()

/**
 * slugify()
 */
export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/[. )(]/g, '-') // Replace spaces and brackets -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

/**
 * writeToDisk()
 */
export const writeToDisk = (fileName: string, content: any) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, content, (err: Error) => {
      if (err) return reject(err)
      else return resolve(true)
    })
  })
}
