import API, { JSONHTTPError } from 'micro-api-client';
import Admin from './admin';

const ExpiryMargin = 60 * 1000;
const storageKey = 'gotrue.user';
const refreshPromises = {};
let currentUser = null;
const forbiddenUpdateAttributes = { api: 1, token: 1, audience: 1, url: 1 };
const forbiddenSaveAttributes = { api: 1 };
const isBrowser = () => typeof window !== 'undefined';

export default class User {
  constructor(api, tokenResponse, audience) {
    this.api = api;
    this.url = api.apiURL;
    this.audience = audience;
    this._processTokenResponse(tokenResponse);
    currentUser = this;
  }

  static removeSavedSession() {
    isBrowser() && localStorage.removeItem(storageKey);
  }

  static recoverSession(apiInstance) {
    if (currentUser) {
      return currentUser;
    }

    const json = isBrowser() && localStorage.getItem(storageKey);
    if (json) {
      try {
        const data = JSON.parse(json);
        const { url, token, audience } = data;
        if (!url || !token) {
          return null;
        }

        const api = apiInstance || new API(url, {});
        return new User(api, token, audience)._saveUserData(data, true);
      } catch (ex) {
        console.error(new Error(`Gotrue-js: Error recovering session: ${ex}`));
        return null;
      }
    }

    return null;
  }

  get admin() {
    return new Admin(this);
  }

  update(attributes) {
    return this._request('/user', {
      method: 'PUT',
      body: JSON.stringify(attributes),
    }).then((response) => {
      return this._saveUserData(response)._refreshSavedSession();
    });
  }

  jwt(forceRefresh) {
    const token = this.tokenDetails();
    if (token === null || token === undefined) {
      return Promise.reject(new Error(`Gotrue-js: failed getting jwt access token`));
    }
    const { expires_at, refresh_token, access_token } = token;
    if (forceRefresh || expires_at - ExpiryMargin < Date.now()) {
      return this._refreshToken(refresh_token);
    }
    return Promise.resolve(access_token);
  }

  logout() {
    return this._request('/logout', { method: 'POST' })
      .then(this.clearSession.bind(this))
      .catch(this.clearSession.bind(this));
  }

  _refreshToken(refresh_token) {
    if (refreshPromises[refresh_token]) {
      return refreshPromises[refresh_token];
    }
    return (refreshPromises[refresh_token] = this.api
      .request('/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
      })
      .then((response) => {
        delete refreshPromises[refresh_token];
        this._processTokenResponse(response);
        this._refreshSavedSession();
        return this.token.access_token;
      })
      .catch((error) => {
        delete refreshPromises[refresh_token];
        this.clearSession();
        return Promise.reject(error);
      }));
  }

  _request(path, options = {}) {
    options.headers = options.headers || {};
    options.headers['apikey'] = process.env.NEXT_PUBLIC_SUPABASE_APIKEY;
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers['X-JWT-AUD'] = aud;
    }

    return this.jwt().then((token) => {
      return this.api
        .request(path, {
          headers: Object.assign(options.headers, {
            Authorization: `Bearer ${token}`,
          }),
          ...options,
        })
        .catch((err) => {
          if (err instanceof JSONHTTPError && err.json) {
            if (err.json.msg) {
              err.message = err.json.msg;
            } else if (err.json.error) {
              err.message = `${err.json.error}: ${err.json.error_description}`;
            }
          }
          return Promise.reject(err);
        });
    });
  }

  getUserData() {
    return this._request('/user')
      .then(this._saveUserData.bind(this))
      .then(this._refreshSavedSession.bind(this));
  }

  _saveUserData(attributes, fromStorage) {
    for (const key in attributes) {
      if (key in User.prototype || key in forbiddenUpdateAttributes) {
        continue;
      }
      this[key] = attributes[key];
    }
    if (fromStorage) {
      this._fromStorage = true;
    }
    return this;
  }

  _processTokenResponse(tokenResponse) {
    this.token = tokenResponse;
    let claims;
    try {
      claims = JSON.parse(urlBase64Decode(tokenResponse.access_token.split('.')[1]));
      this.token.expires_at = claims.exp * 1000;
    } catch (e) {
      console.error(
        new Error(
          `Gotrue-js: Failed to parse tokenResponse claims: ${JSON.stringify(tokenResponse)}`,
        ),
      );
    }
  }

  _refreshSavedSession() {
    // only update saved session if we previously saved something
    if (isBrowser() && localStorage.getItem(storageKey)) {
      this._saveSession();
    }
    return this;
  }

  get _details() {
    const userCopy = {};
    for (const key in this) {
      if (key in User.prototype || key in forbiddenSaveAttributes) {
        continue;
      }
      userCopy[key] = this[key];
    }
    return userCopy;
  }

  _saveSession() {
    isBrowser() && localStorage.setItem(storageKey, JSON.stringify(this._details));
    return this;
  }

  tokenDetails() {
    return this.token;
  }

  clearSession() {
    User.removeSavedSession();
    this.token = null;
    currentUser = null;
  }
}

function urlBase64Decode(str) {
  // From https://jwt.io/js/jwt.js
  var output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw 'Illegal base64url string!';
  }
  var result = window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
  try {
    return decodeURIComponent(escape(result));
  } catch (err) {
    return result;
  }
}