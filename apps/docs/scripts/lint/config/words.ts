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
  .addSingle('Amazon')
  .addSingle('Analytics')
  .addSingle('Android')
  .addSingle('Angular')
  .addSingle('App Router')
  .addSingle('Apple')
  .addPlural('API')
  .addSingle('Auth')
  .addSingle('Auth Helpers')
  .addSingle('Auth UI')
  .addSingle('Azure')
  .addSingle('Azure Developer')
  .addSingle('Bitbucket')
  .addSingle('Captcha')
  .addSingle('ChatGPT')
  .addPlural('ChatGPT Retrieval Plugin')
  .addSingle('Chrome')
  .addSingle('Code Exchange')
  .addSingle('Dart')
  .addSingle('Dart Edge')
  .addPlural('Database Function')
  .addSingle('Deno')
  .addSingle('Discord')
  .addPlural('Discord Developer')
  .addSingle('Drizzle')
  .addSingle('Edge')
  .addPlural('Edge Function')
  .addSingle('Enterprise')
  .addSingle('Expo')
  .addSingle('Facebook')
  .addSingle('Facebook Developers')
  .addSingle('Figma')
  .addSingle('Figma Developers')
  .addSingle('Firebase')
  .addSingle('Firestore')
  .addSingle('Firestore Storage')
  .addSingle('Flutter')
  .addPlural('Foreign Data Wrapper')
  .addSingle('Git')
  .addSingle('GitHub')
  .addSingle('GitHub Actions')
  .addSingle('GitLab')
  .addSingle('Google')
  .addSingle('Google Workspace')
  .addSingle('GraphQL')
  .addSingle('Heroku')
  .addSingle('Hilt')
  .addSingle('HTTP-Only')
  .addSingle('Hugging Face')
  .addSingle('IdP')
  .addSingle('Ionic')
  .addSingle('Inbucket')
  .addSingle('IVFFlat')
  .addSingle('JavaScript')
  .addPlural('JSON Web Token')
  .addSingle('Kakao')
  .addPlural('Kakao Developer')
  .addSingle('Keycloak')
  .addSingle('Kotlin')
  .addSingle('LinkedIn')
  .addPlural('LinkedIn Developer')
  .addSingle('Logs Explorer')
  .addSingle('Management API')
  .addSingle('MessageBird')
  .addSingle('Multi-factor Authentication')
  .addSingle('Navigable Small World')
  .addSingle('Next.js')
  .addSingle('Notion')
  .addSingle('Nuxt')
  .addSingle('OAuth')
  .addSingle('OpenAI')
  .addSingle('Open ID Connect')
  .addSingle('Pages Router')
  .addSingle('PgBouncer')
  .addSingle('Phoenix')
  .addSingle('Poetry')
  .addSingle('Postgres')
  .addSingle('Postgres.js')
  .addSingle('PostgreSQL')
  .addSingle('Programmable Messaging')
  .addSingle('Proof Key for Code Exchange')
  .addSingle('Python')
  .addPlural('Read Replica')
  .addSingle('React')
  .addSingle('React Native')
  .addSingle('RedwoodJS')
  .addSingle('Remix')
  .addSingle('Render')
  .addSingle('Roboflow')
  .addSingle('Roboflow Inference')
  .addSingle('Row Level Security')
  .addSingle('Server Side Rendering')
  .addSingle('Single Page Application')
  .addSingle('Slack')
  .addPlural('Slack Developer')
  .addPlural('Slash Command')
  .addSingle('SolidJS')
  .addSingle('Spend Cap')
  .addSingle('Spotify')
  .addPlural('Spotify Developer')
  .addSingle('Supabase')
  .addSingle('Storage')
  .addSingle('Svelte')
  .addSingle('SvelteKit')
  .addSingle('Swift')
  .addSingle('SwiftUI')
  .addSingle('Transformers.js')
  .addSingle('Twilio')
  .addSingle('Twilio Verify')
  .addSingle('Twitch')
  .addPlural('Twitch Developer')
  .addSingle('Twitter')
  .addPlural('Twitter Developer')
  .addSingle('TypeScript')
  .addPlural('URI')
  .addPlural('URL')
  .addSingle('Vault')
  .addSingle('Vecs')
  .addSingle('Visual Studio Code')
  .addSingle('Vue')
  .addSingle('VSCode')
  .addSingle('Vonage')
  .addSingle('WebP')
  .addSingle('WhatsApp')
  .addPlural('Write-Ahead Log')
  .addSingle('WorkOS')
  .addPlural('Wrapper')
  .addSingle('Xcode')
  .addSingle('Zoom')
  .addPlural('Zoom Developer')

export { capitalizedWords }
