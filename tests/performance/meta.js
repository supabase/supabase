import http from 'k6/http'

export const options = {
  vus: 5,
  duration: '10s',
}

const META_URL = 'http://localhost:5555/tables'

export default function () {
  http.get(META_URL)
}
