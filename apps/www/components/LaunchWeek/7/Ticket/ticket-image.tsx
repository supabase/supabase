import { useRouter } from 'next/router'
import Head from 'next/head'
import TicketVisual from './TicketVisual'
import styles from './ticket-image.module.css'

export default function TicketImage() {
  const { query } = useRouter()
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
          {/* <TicketVisual
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
            golden={query.golden ? true : false}
          /> */}
        </div>
      </div>
    )
  }
  return <></>
}
