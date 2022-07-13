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

import IconLogo from './icons/icon-logo'
import styles from './logo.module.css'
import { SITE_NAME_MULTILINE } from '~/lib/launchweek/constants'

export default function Logo({ textSecondaryColor = 'var(--accents-5)' }) {
  return (
    <div className={styles.logo}>
      <div className={styles.icon}>
        <IconLogo backgroundColor="var(--accents-1)" foregroundColor="black" />
      </div>
      <div className={styles.text}>
        <div>{SITE_NAME_MULTILINE[0]}</div>
        <div
          style={{ ['--color' as string]: textSecondaryColor }}
          className={styles['text-secondary']}
        >
          {SITE_NAME_MULTILINE[1]}
        </div>
      </div>
    </div>
  )
}
