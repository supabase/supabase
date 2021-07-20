import PostgresMetaInterface from './MetaInterface'

export default class ExtensionsStore extends PostgresMetaInterface {
  constructor(rootStore, dataUrl, options) {
    super(rootStore, dataUrl, options)
  }
}
