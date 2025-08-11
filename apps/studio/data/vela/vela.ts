import createClient, { Client } from 'openapi-fetch'
import { paths } from './vela-schema'
import { VELA_PLATFORM_URL } from '../../pages/api/constants.js'


const velaClient = createClient<paths>({
  baseUrl: VELA_PLATFORM_URL,
  credentials: 'include',
  redirect: 'follow',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getVelaClient() {
  return velaClient
}
