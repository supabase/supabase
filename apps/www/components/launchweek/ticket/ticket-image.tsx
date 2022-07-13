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

import { useRouter } from 'next/router';
import Head from 'next/head';
import TicketVisual from './ticket-visual';
import styles from './ticket-image.module.css';

export default function TicketImage() {
  const { query } = useRouter();
  if (query.ticketNumber) {
    return (
      <div className={styles.background}>
        <div className={styles.page}>
          <Head>
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&Noto+Sans+HK:wght@700&family=Noto+Sans+JP:wght@700&family=Noto+Sans+KR:wght@700&family=Noto+Sans+SC:wght@700&family=Noto+Sans+TC:wght@700&family=Noto+Sans:wght@700&display=swap"
              rel="stylesheet"
            />
          </Head>
          <TicketVisual
            size={1700 / 650}
            username={query.username ? query.username.toString() : undefined}
            ticketNumber={parseInt(query.ticketNumber.toString(), 10)}
            name={
              query.name
                ? query.name?.toString()
                : query.username
                ? query.username.toString()
                : undefined
            }
          />
        </div>
      </div>
    );
  }
  return <></>;
}
