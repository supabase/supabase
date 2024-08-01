import type { Tensor } from '@xenova/transformers'

const MODEL = 'Supabase/gte-small'

export interface Extractor {
  extract: (input: string) => Promise<Tensor>
}

export function setupSingletonExtractor() {
  let _extractor: Extractor

  async function extractor() {
    if (!_extractor) {
      const { pipeline } = await import('@xenova/transformers')
      const pipe = await pipeline('feature-extraction', MODEL)

      function extract(input: string) {
        return pipe(input, { pooling: 'mean', normalize: true })
      }
      _extractor = { extract }
    }

    return _extractor
  }

  return extractor
}
