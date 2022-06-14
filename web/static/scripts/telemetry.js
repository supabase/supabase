function telemetry() {
  setTimeout(function () {
    return fetch('https://api.supabase.io/platform/telemetry/page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      referrerPolicy: 'no-referrer-when-downgrade',
      body: JSON.stringify({
        referrer: document.referrer,
        title: document.title,
      }),
    }).catch((error) => {
      console.error('Error at telemetry - post:', error)
    })
  }, 1000)
}

function pageState() {
  ;(function () {
    var pushState = history.pushState
    var replaceState = history.replaceState

    history.pushState = function () {
      pushState.apply(history, arguments)
      window.dispatchEvent(new Event('pushstate'))
      window.dispatchEvent(new Event('locationchange'))
    }

    history.replaceState = function () {
      replaceState.apply(history, arguments)
      window.dispatchEvent(new Event('replacestate'))
      window.dispatchEvent(new Event('locationchange'))
    }

    window.addEventListener('popstate', function () {
      window.dispatchEvent(new Event('locationchange'))
    })
  })()

  window.addEventListener('locationchange', function () {
    telemetry()
  })
}

pageState()
telemetry()
