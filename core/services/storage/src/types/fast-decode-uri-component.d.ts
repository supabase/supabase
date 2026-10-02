declare module 'fast-decode-uri-component' {
  /**
   * Decodes a URI component without allocating when there is nothing to decode
   * (returns the input unchanged when it contains no `%`). Returns `null`
   * instead of throwing when the input is malformed.
   */
  function fastDecodeURIComponent(uri: string): string | null
  export default fastDecodeURIComponent
}
