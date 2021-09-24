import AppStore from './app/AppStore'
import PostgresStore from './postgres/PostgresStore'

export default class RootStore {
  app: AppStore
  database: PostgresStore
  isPlatform = false

  constructor({ postgresApiUrl, apiUrl }: { postgresApiUrl: string; apiUrl: string }) {
    this.app = new AppStore(this, apiUrl)
    this.database = new PostgresStore(this, postgresApiUrl)

    this.loadDefaults()
  }

  loadDefaults() {
    if (!this.app) return false

    // Default Project
    this.app.projects.data = {
      '0': {
        id: 0,
        name: 'Supabase',
      },
    }
  }

  load() {
    if (this.isPlatform) {
      this.app.projects.load()
    }
  }
}
