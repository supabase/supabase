import { pipeline } from '@xenova/transformers'

const MODEL = 'Supabase/gte-small'

/**
 * @typedef {Object} Extractor
 * @property {(input: string) => Promise<Tensor>} extract
 */

export function setupSingletonExtractor() {
  /**
   * @type {Extractor}
   */
  let _extractor

  async function extractor() {
    if (!_extractor) {
      const pipe = await pipeline('feature-extraction', MODEL)

      function extract(input) {
        return pipe(input, { pooling: 'mean', normalize: true })
      }
      _extractor = { extract }
    }

    return _extractor
  }

  return extractor
}
