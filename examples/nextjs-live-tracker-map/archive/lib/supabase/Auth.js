import superagent from 'superagent'

const isBrowser = () => typeof window !== 'undefined'
const storageKey = 'supabase.auth.token'

class Auth {
  constructor(authUrl, supabaseKey, options = { autoRefreshToken: true, persistSession: true }) {
    this.authUrl = authUrl
    this.accessToken = supabaseKey
    this.refreshToken = null
    this.supabaseKey = supabaseKey
    this.currentUser = null
    this.autoRefreshToken = options.autoRefreshToken === undefined ? true : options.autoRefreshToken
    this.persistSession = options.persistSession === undefined ? true : options.persistSession

    this.signup = async (email, password) => {
      this.removeSavedSession() // clean out the old session before attempting
      const response = await superagent
        .post(`${authUrl}/signup`, { email, password })
        .set('accept', 'json')
        .set('apikey', this.supabaseKey)

      if (response.status === 200 && response['body']['user']['confirmed_at']) {
        this.accessToken = response.body['access_token']
        this.refreshToken = response.body['refresh_token']
        this.currentUser = response.body['user']
        let tokenExpirySeconds = response.body['expires_in']
        if (this.autoRefreshToken && tokenExpirySeconds)
          setTimeout(this.callRefreshToken, (tokenExpirySeconds - 60) * 1000)
        if (this.persistSession) {
          const timeNow = Math.round(Date.now() / 1000)
          this.saveSession(
            this.accessToken,
            this.refreshToken,
            timeNow + tokenExpirySeconds,
            this.currentUser
          )
        }
      }
      return response
    }

    this.login = async (email, password) => {
      this.removeSavedSession() // clean out the old session before attempting
      let response = await superagent
        .post(`${authUrl}/token?grant_type=password`, { email, password })
        .set('accept', 'json')
        .set('apikey', this.supabaseKey)

      if (response.status === 200) {
        this.accessToken = response.body['access_token']
        this.refreshToken = response.body['refresh_token']
        this.currentUser = response.body['user']
        let tokenExpirySeconds = response.body['expires_in']
        if (this.autoRefreshToken && tokenExpirySeconds)
          setTimeout(this.callRefreshToken, (tokenExpirySeconds - 60) * 1000)
        if (this.persistSession) {
          const timeNow = Math.round(Date.now() / 1000)
          this.saveSession(
            this.accessToken,
            this.refreshToken,
            timeNow + tokenExpirySeconds,
            this.currentUser
          )
        }
      }
      return response
    }

    this.callRefreshToken = async () => {
      let response = await superagent
        .post(`${authUrl}/token?grant_type=refresh_token`, { refresh_token: this.refreshToken })
        .set('accept', 'json')
        .set('apikey', this.supabaseKey)

      if (response.status === 200) {
        this.accessToken = response.body['access_token']
        this.refreshToken = response.body['refresh_token']
        let tokenExpirySeconds = response.body['expires_in']
        if (this.autoRefreshToken && tokenExpirySeconds)
          setTimeout(this.callRefreshToken, (tokenExpirySeconds - 60) * 1000)
        if (this.persistSession) {
          const timeNow = Math.round(Date.now() / 1000)
          this.saveSession(
            this.accessToken,
            this.refreshToken,
            timeNow + tokenExpirySeconds,
            this.currentUser
          )
        }
      }
      return response
    }

    this.logout = async () => {
      await superagent
        .post(`${authUrl}/logout`)
        .set('Authorization', `Bearer ${this.accessToken}`)
        .set('apikey', this.supabaseKey)

      this.removeSavedSession()
    }

    this.user = async () => {
      if (this.currentUser) return this.currentUser

      let response = await superagent
        .get(`${authUrl}/user`)
        .set('Authorization', `Bearer ${this.accessToken}`)
        .set('apikey', this.supabaseKey)

      if (response.status === 200) {
        this.currentUser = response.body
        this.currentUser['access_token'] = this.accessToken
        this.currentUser['refresh_token'] = this.refreshToken
      }
      return this.currentUser
    }

    this.saveSession = (accessToken, refreshToken, expiresAt, currentUser) => {
      const data = { accessToken, refreshToken, expiresAt, currentUser }
      isBrowser() && localStorage.setItem(storageKey, JSON.stringify(data))
    }

    this.removeSavedSession = () => {
      this.currentUser = null
      this.refreshToken = null
      this.accessToken = this.supabaseKey
      isBrowser() && localStorage.removeItem(storageKey)
    }

    this.authHeader = () => {
      let json = isBrowser() && localStorage.getItem(storageKey)
      let persisted = json ? JSON.parse(json) : null
      if (persisted?.accessToken) return `Bearer ${persisted.accessToken}`
      else if (this.accessToken) return `Bearer ${this.accessToken}`
      else return null
    }

    this.recoverSession = () => {
      const json = isBrowser() && localStorage.getItem(storageKey)
      if (json) {
        try {
          const data = JSON.parse(json)
          const { accessToken, refreshToken, currentUser, expiresAt } = data

          const timeNow = Math.round(Date.now() / 1000)
          if (expiresAt < timeNow) {
            console.log('saved session has expired')
            this.removeSavedSession()
          } else {
            this.accessToken = accessToken
            this.refreshToken = refreshToken
            this.currentUser = currentUser
            // schedule a refresh 60 seconds before token due to expire
            setTimeout(this.callRefreshToken, (expiresAt - timeNow - 60) * 1000)
          }
        } catch (err) {
          console.error(err)
          return null
        }
      }

      return null
    }

    this.recoverSession()
  }
}

export { Auth }
