interface DataProps {
  [prop: string]: any
}

export const get = (url: string, options = {} as { [key: string]: any }) => {
  const { headers: optionHeaders, ...otherOptions } = options

  let headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
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

export const post = (url: string, data: DataProps, options = {} as { [key: string]: any }) => {
  const { headers: optionHeaders, ...otherOptions } = options

  let headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
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
