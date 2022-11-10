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

import styles from './ticket-info.module.css'
import cn from 'classnames'
import { DATE, SITE_URL } from '~/lib/constants'

const siteUrl = new URL(SITE_URL)
const siteUrlForTicket = `${siteUrl.host}${siteUrl.pathname}`.replace(/\/$/, '')

export default function TicketInfo({
  logoTextSecondaryColor = 'var(--accents-5)',
  golden = false,
}) {
  return (
    <div className={styles.info}>
      <div className={cn(styles.date, { [styles['date-golden']]: golden })}>
        <div>{DATE}</div>
      </div>
      <div className={cn(styles.url, { [styles['url-golden']]: golden })}>{siteUrlForTicket}</div>
    </div>
  )
}
