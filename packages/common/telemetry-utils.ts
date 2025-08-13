import { isBrowser } from './helpers'

export function getSharedTelemetryData(pathname?: string) {
  return {
    page_url: isBrowser ? window.location.href : '',
    page_title: isBrowser ? document?.title : '',
    pathname: pathname ? pathname : isBrowser ? window.location.pathname : '',
    ph: {
      referrer: isBrowser ? document?.referrer : '',
      language: navigator.language ?? 'en-US',
      user_agent: navigator.userAgent,
      search: isBrowser ? window.location.search : '',
      viewport_height: isBrowser ? window.innerHeight : 0,
      viewport_width: isBrowser ? window.innerWidth : 0,
    },
  }
}
