interface DataProps {
  [prop: string]: any
}

export const post = (url: string, data: DataProps, options = {} as { [key: string]: any }) => {
  const { optionHeaders, ...otherOptions } = options
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...optionHeaders,
    },
    credentials: 'include',
    referrerPolicy: 'no-referrer-when-downgrade',
    body: JSON.stringify(data),
    ...otherOptions,
  }).catch((error) => {
    console.error('Error at fetchWrapper - post:', error)
  })
}
