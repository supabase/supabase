import { getAccessToken } from './auth'

interface DataProps {
  [prop: string]: any
}

export async function get(url: string, options = {} as { [key: string]: any }) {
  const { headers: optionHeaders, ...otherOptions } = options

  const accessToken = await getAccessToken()

  let headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...optionHeaders,
  })

  return fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
    referrerPolicy: 'no-referrer-when-downgrade',
    ...otherOptions,
  })
    .then((res) => res.json())
    .catch((error) => {
      throw error
    })
}

export async function post(url: string, data: DataProps, options = {} as { [key: string]: any }) {
  const { headers: optionHeaders, ...otherOptions } = options

  const accessToken = await getAccessToken()

  let headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...optionHeaders,
  })

  return fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    referrerPolicy: 'no-referrer-when-downgrade',
    body: JSON.stringify(data),
    ...otherOptions,
  }).catch((error) => {
    throw error
  })
}
