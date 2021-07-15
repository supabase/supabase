import PostgresMetaInterface from './MetaInterface'

export default class PoliciesStore extends PostgresMetaInterface {
  constructor(rootStore, dataUrl, options) {
    super(rootStore, dataUrl, options)
  }
}
