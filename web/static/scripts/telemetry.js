function telemetry() {
  return fetch('https://app.supabase.io/api/telemetry/page', {
    mode: 'cors', // 'cors' by default,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      referrer: document.referrer,
      title: document.title,
    }),
  }).catch((error) => {
    console.error('Error at telemetry - post:', error)
  })
}

telemetry()
