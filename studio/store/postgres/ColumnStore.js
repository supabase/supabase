import PostgresMetaInterface from './MetaInterface'

export default class ColumnStore extends PostgresMetaInterface {
  constructor(rootStore, dataUrl, options) {
    super(rootStore, dataUrl, options)
  }
}
