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
      // Sort the words by decreasing length to capture longer exceptions first
      const multiwords = this.map
        .get(word)
        .filter(ExceptionList.isMultiword)
        .sort((a, b) => b.length - a.length)
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
  .addPlural('API')
  .addSingle('Auth')
  .addSingle('Auth UI')
  .addSingle('Azure')
  .addSingle('Bitbucket')
  .addSingle('Captcha')
  .addSingle('ChatGPT')
  .addPlural('ChatGPT Retrieval Plugin')
  .addSingle('Code Exchange')
  .addSingle('Discord')
  .addPlural('Edge Function')
  .addSingle('Facebook')
  .addSingle('Figma')
  .addSingle('Firebase')
  .addSingle('Flutter')
  .addPlural('Foreign Data Wrapper')
  .addSingle('GitHub')
  .addSingle('GitHub Actions')
  .addSingle('Hugging Face')
  .addSingle('IVFFlat')
  .addPlural('JSON Web Token')
  .addSingle('Kakao')
  .addSingle('Keycloak')
  .addSingle('LinkedIn')
  .addSingle('MessageBird')
  .addSingle('Multi-factor Authentication')
  .addSingle('Navigable Small World')
  .addSingle('Next.js')
  .addSingle('OAuth')
  .addSingle('OpenAI')
  .addSingle('Open ID Connect')
  .addSingle('Poetry')
  .addSingle('Postgres')
  .addSingle('Python')
  .addSingle('Remix')
  .addSingle('Roboflow')
  .addSingle('Roboflow Inference')
  .addSingle('Row Level Security')
  .addSingle('Single Page Application')
  .addSingle('Slack')
  .addSingle('Spotify')
  .addSingle('Supabase')
  .addSingle('Svelte')
  .addSingle('SvelteKit')
  .addSingle('Transformers.js')
  .addSingle('Twilio')
  .addSingle('Twilio Verify')
  .addSingle('Twitch')
  .addSingle('Twitter')
  .addSingle('TypeScript')
  .addSingle('Vonage')
  .addSingle('WebP')
  .addSingle('WhatsApp')
  .addSingle('WorkOS')
  .addPlural('Wrapper')
  .addSingle('Zoom')

export { capitalizedWords }
