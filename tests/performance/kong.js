import http from 'k6/http'

export const options = {
  vus: 1,
  duration: '10s',
}

const META_URL = 'http://localhost:8000/'

export default function () {
  http.get(META_URL)
}
