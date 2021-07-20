import PostgresMetaInterface from './MetaInterface'

export default class PublicationStore extends PostgresMetaInterface {
  constructor(rootStore, dataUrl, options) {
    super(rootStore, dataUrl, options)
  }
}
