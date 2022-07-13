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
import { nanoid } from 'nanoid'
import { ConfUser } from '~/lib/launchweek/types'
import validator from 'validator'
import { COOKIE } from '~/lib/launchweek/constants'
import cookie from 'cookie'
import ms from 'ms'
import { getTicketNumberByUserId, getUserById, createUser } from '~/lib/launchweek/db-api'
import { emailToId } from '~/lib/launchweek/user-api'
import { validateCaptchaResult, IS_CAPTCHA_ENABLED } from '~/lib/launchweek/captcha'

type ErrorResponse = {
  error: {
    code: string
    message: string
  }
}

export default async function register(
  req: NextApiRequest,
  res: NextApiResponse<ConfUser | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(501).json({
      error: {
        code: 'method_unknown',
        message: 'This endpoint only responds to POST',
      },
    })
  }

  const email: string = ((req.body.email as string) || '').trim().toLowerCase()
  const token: string = req.body.token as string
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      error: {
        code: 'bad_email',
        message: 'Invalid email',
      },
    })
  }

  if (IS_CAPTCHA_ENABLED) {
    const isCaptchaValid = await validateCaptchaResult(token)

    if (!isCaptchaValid) {
      return res.status(400).json({
        error: {
          code: 'bad_captcha',
          message: 'Invalid captcha',
        },
      })
    }
  }

  let id = nanoid()
  let ticketNumber: number
  let createdAt: number = Date.now()
  let statusCode = 200
  let name: string | null | undefined = undefined
  let username: string | null | undefined = undefined

  id = emailToId(email)
  const existingTicketNumberString = await getTicketNumberByUserId(id)

  if (existingTicketNumberString) {
    const user = await getUserById(id)
    name = user.name
    username = user.username
    ticketNumber = parseInt(existingTicketNumberString, 10)
    createdAt = user.createdAt!
    statusCode = 200
  } else {
    const newUser = await createUser(id, email)
    ticketNumber = newUser.ticketNumber!
    createdAt = newUser.createdAt!
    statusCode = 201
  }

  // Save `key` in a httpOnly cookie
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(COOKIE, id, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/api',
      expires: new Date(Date.now() + ms('7 days')),
    })
  )

  return res.status(statusCode).json({
    id,
    email,
    ticketNumber,
    createdAt,
    name,
    username,
  })
}
