import { redirect } from 'react-router'

export async function clientLoader() {
  throw redirect('/projects/default')
}
