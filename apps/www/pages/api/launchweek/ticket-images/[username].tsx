/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NextApiRequest, NextApiResponse } from 'next'
import screenshot from '~/lib/launchweek/screenshot'
import { SITE_URL, SAMPLE_TICKET_NUMBER } from '~/lib/launchweek/constants'
import { getUserByUsername } from '~/lib/launchweek/db-api'

export default async function ticketImages(req: NextApiRequest, res: NextApiResponse) {
  let url: string
  let name: string | null | undefined
  let ticketNumber: number | null | undefined = SAMPLE_TICKET_NUMBER
  const { username } = req.query || {}
  if (username) {
    const usernameString = username.toString()
    const user = await getUserByUsername(usernameString)
    console.log(user)
    name = user.name
    ticketNumber = user.ticketNumber
    url = `${SITE_URL}/ticket-image?username=${encodeURIComponent(
      usernameString
    )}&ticketNumber=${encodeURIComponent(ticketNumber ?? SAMPLE_TICKET_NUMBER)}`
    if (name) {
      url = `${url}&name=${encodeURIComponent(name)}`
    }
    console.log(url)
    const file = await screenshot(url)
    res.setHeader('Content-Type', `image/png`)
    res.setHeader(
      'Cache-Control',
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
    )
    res.statusCode = 200
    res.end(file)
  } else {
    res.status(404).send('Not Found')
  }
}
