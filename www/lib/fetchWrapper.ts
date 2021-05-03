interface DataProps {
  referrer?: string
  title: string
}

export const post = (url: string, data: DataProps, options = {}) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    referrerPolicy: 'no-referrer-when-downgrade',
    body: JSON.stringify(data),
    ...options,
  }).catch((error) => {
    console.error('Error at fetchWrapper - post:', error)
  })
}
