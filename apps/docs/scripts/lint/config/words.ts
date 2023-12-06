class ExceptionList {
  private map: Map<string, string[]>

  static isMultiword(word: string) {
    return /\s+/.test(word)
  }

  constructor() {
    this.map = new Map()
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
    advanceIndexBy?: number
  } {
    if (this.map.has(word)) {
      // If the exception list contains multiword terms, check for the multiword term
      const multiwords = this.map.get(word).filter(ExceptionList.isMultiword)
      for (const term of multiwords) {
        if (fullString.indexOf(term, index) === index) {
          return { exception: true, advanceIndexBy: term.length - word.length }
        }
      }

      // If word directly matches, then it's on the exception list
      if (this.map.get(word).includes(word)) {
        return { exception: true, advanceIndexBy: 0 }
      }
    }

    // 0 beause it means the cursor doesn't need to move
    return { exception: false }
  }
}

const capitalizedWords = new ExceptionList()
capitalizedWords
  .addSingle('Auth')
  .addSingle('Auth UI')
  .addPlural('API')
  .addSingle('Captcha')
  .addSingle('ChatGPT')
  .addPlural('ChatGPT Retrieval Plugin')
  .addSingle('CLI')
  .addSingle('CLIP')
  .addSingle('CSS')
  .addSingle('Edge Function')
  .addSingle('Firebase')
  .addSingle('Flutter')
  .addPlural('Foreign Data Wrapper')
  .addSingle('GitHub Actions')
  .addSingle('HNSW')
  .addSingle('HTML')
  .addSingle('Hugging Face')
  .addSingle('I')
  .addSingle('IVFFlat')
  .addSingle('JSON')
  .addPlural('JSON Web Token')
  .addPlural('JWT')
  .addSingle('L2')
  .addSingle('Navigabel Small World')
  .addSingle('Next.js')
  .addSingle('OAuth')
  .addSingle('OpenAI')
  .addSingle('PKCE')
  .addSingle('Poetry')
  .addSingle('Postgres')
  .addSingle('Python')
  .addSingle('REST')
  .addSingle('RLS')
  .addSingle('Roboflow')
  .addSingle('Roboflow Inference')
  .addSingle('Row Level Security')
  .addSingle('SSR')
  .addSingle('Supabase')
  .addSingle('Transformers.js')
  .addSingle('TypeScript')
  .addPlural('URL')
  .addSingle('WebP')
  .addPlural('Wrapper')

export { capitalizedWords }
