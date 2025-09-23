import { getAccessToken } from 'common'

interface DataProps {
  [prop: string]: any
}

export async function get(url: string, options?: RequestInit) {
  const accessToken = await getAccessToken()

  let headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  })

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return fetch(url, {
    method: 'GET',
    headers,
    referrerPolicy: 'no-referrer-when-downgrade',
    ...options,
  })
}

export async function post(url: string, data: DataProps, options?: RequestInit) {
  const { headers: optionHeaders, ...otherOptions } = options || {}
  const accessToken = await getAccessToken()

  let headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...optionHeaders,
  })

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    referrerPolicy: 'no-referrer-when-downgrade',
    body: JSON.stringify(data),
    ...otherOptions,
  })
}
