import API, { JSONHTTPError } from 'micro-api-client';
import User from './user';

const HTTPRegexp = /^http:\/\//;
const defaultApiURL = `/.netlify/identity`;

export default class GoTrue {
  constructor({ APIUrl = defaultApiURL, audience = '', setCookie = false } = {}) {
    if (APIUrl.match(HTTPRegexp)) {
      console.warn(
        'Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely.',
      );
    }

    if (audience) {
      this.audience = audience;
    }

    this.setCookie = setCookie;

    this.api = new API(APIUrl);
  }

  _request(path, options = {}) {
    options.headers = options.headers || {};
    options.headers['apikey'] = process.env.NEXT_PUBLIC_SUPABASE_APIKEY;
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers['X-JWT-AUD'] = aud;
    }
    return this.api.request(path, options).catch((err) => {
      if (err instanceof JSONHTTPError && err.json) {
        if (err.json.msg) {
          err.message = err.json.msg;
        } else if (err.json.error) {
          err.message = `${err.json.error}: ${err.json.error_description}`;
        }
      }
      return Promise.reject(err);
    });
  }

  settings() {
    return this._request('/settings');
  }

  signup(email, password, data) {
    return this._request('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, data }),
    });
  }

  login(email, password, remember) {
    this._setRememberHeaders(remember);
    return this._request('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((response) => {
      User.removeSavedSession();
      return this.createUser(response, remember);
    });
  }

  loginWithRefreshToken(refreshToken, remember) {
    this._setRememberHeaders(remember);
    return this._request('/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).then((response) => {
      User.removeSavedSession();
      return this.createUser(response, remember);
    });
  }

  loginExternalUrl(provider) {
    return `${this.api.apiURL}/authorize?provider=${provider}`;
  }

  confirm(token, remember) {
    this._setRememberHeaders(remember);
    return this.verify('signup', token, remember);
  }

  requestPasswordRecovery(email) {
    return this._request('/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  recover(token, remember) {
    this._setRememberHeaders(remember);
    return this.verify('recovery', token, remember);
  }

  acceptInvite(token, password, remember) {
    this._setRememberHeaders(remember);
    return this._request('/verify', {
      method: 'POST',
      body: JSON.stringify({ token, password, type: 'signup' }),
    }).then((response) => this.createUser(response, remember));
  }

  acceptInviteExternalUrl(provider, token) {
    return `${this.api.apiURL}/authorize?provider=${provider}&invite_token=${token}`;
  }

  createUser(tokenResponse, remember = false) {
    this._setRememberHeaders(remember);
    const user = new User(this.api, tokenResponse, this.audience);
    return user.getUserData().then((user) => {
      if (remember) {
        user._saveSession();
      }
      return user;
    });
  }

  currentUser() {
    const user = User.recoverSession(this.api);
    user && this._setRememberHeaders(user._fromStorage);
    return user;
  }

  verify(type, token, remember) {
    this._setRememberHeaders(remember);
    return this._request('/verify', {
      method: 'POST',
      body: JSON.stringify({ token, type }),
    }).then((response) => this.createUser(response, remember));
  }

  _setRememberHeaders(remember) {
    if (this.setCookie) {
      this.api.defaultHeaders = this.api.defaultHeaders || {};
      this.api.defaultHeaders['X-Use-Cookie'] = remember ? '1' : 'session';
    }
  }
}

if (typeof window !== 'undefined') {
  window.GoTrue = GoTrue;
}