import { fromMarkdown } from 'mdast-util-from-markdown'
import { toString } from 'mdast-util-to-string'

export const mdToPlainText = (markdown: string): string => toString(fromMarkdown(markdown))
