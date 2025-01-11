interface DataProps {
  [prop: string]: any
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
    console.error('Error at fetchWrapper - post:', error)
  })
}
