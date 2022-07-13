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
import { getTicketNumberByUserId, updateUserWithGitHubUser } from '~/lib/launchweek/db-api'

export default async function saveGithubToken(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(501).json({
      error: {
        code: 'method_unknown',
        message: 'This endpoint only responds to POST',
      },
    })
  }

  const body = req.body

  if (!body.token || !body.id) {
    return res.status(400).json({
      error: {
        code: 'bad_input',
        message: 'Invalid parameters',
      },
    })
  }

  const ticketNumber = await getTicketNumberByUserId(body.id)
  if (!ticketNumber) {
    return res.status(404).json({ code: 'invalid_id', message: 'The registration does not exist' })
  }

  const { username, name } = await updateUserWithGitHubUser(body.id, body.token, ticketNumber)

  res.json({ username, name })
}
