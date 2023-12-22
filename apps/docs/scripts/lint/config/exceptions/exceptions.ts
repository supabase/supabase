import { countWords } from '../../utils/words'

export type ExceptionTestPlugin = (
  word: string,
  fullString?: string,
  index?: number
) => ExceptionResult

interface ExceptionResult {
  exception: boolean
  advanceIndexBy: number
  match?: string
}

export class ExceptionList {
  private map: Map<string, string[]>
  private plugins: ExceptionTestPlugin[] | undefined

  static isMultiword(word: string) {
    return /\s+/.test(word)
  }

  constructor({ plugins }: { plugins?: ExceptionTestPlugin[] } = {}) {
    this.map = new Map()
    this.plugins = plugins
  }

  addSingle(word: string) {
    const subWord = word.split(/\s+/)[0]
    if (!this.map.has(subWord)) {
      this.map.set(subWord, [])
    }
    this.map.get(subWord).push(word)
    return this
  }

  addPlural(word: string) {
    this.addSingle(word)
    this.addSingle(`${word}s`)
    return this
  }

  getSortedMultiwords(word: string) {
    // Sort multiwords by order of decreasing word count to capture longer exceptions first
    return this.map
      .get(word)
      .filter(ExceptionList.isMultiword)
      .sort((a, b) => countWords(b) - countWords(a))
  }

  matchException({
    word,
    fullString,
    index,
  }: {
    word: string
    fullString: string
    index: number
  }): {
    exception: boolean
    advanceIndexBy: number
    match?: string
  } {
    if (this.plugins) {
      for (const plugin of this.plugins) {
        const pluginResult = plugin(word, fullString, index)
        if (pluginResult.exception) {
          return pluginResult
        }
      }
    }

    if (this.map.has(word)) {
      const multiwords = this.getSortedMultiwords(word)
      for (const term of multiwords) {
        if (fullString.indexOf(term, index) === index) {
          return { exception: true, match: term, advanceIndexBy: term.length - word.length }
        }
      }

      // If word directly matches, then it's on the exception list
      if (this.map.get(word).includes(word)) {
        return { exception: true, advanceIndexBy: 0 }
      }
    }

    return { exception: false, advanceIndexBy: 0 }
  }
}
