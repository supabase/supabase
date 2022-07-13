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

import px from '~/lib/launchweek/to-pixels'
import cn from 'classnames'
import styles from './loading-dots.module.css'

interface Props {
  size?: number
  height?: number | string
  reverse?: boolean
  children?: React.ReactNode
}

export default function LoadingDots({ size = 2, height, children, reverse }: Props) {
  return (
    <span
      className={cn(styles.loading, { [styles.reverse]: reverse })}
      style={{
        ['--loading-dots-height' as string]: height ? px(height) : undefined,
        ['--loading-dots-size' as string]: size !== 2 ? px(size) : undefined,
      }}
    >
      {children && <div className={styles.spacer}>{children}</div>}
      <span />
      <span />
      <span />
    </span>
  )
}
