import styles from './ticket-info.module.css'
import cn from 'classnames'
import { LW7_DATE, SITE_URL } from '~/lib/constants'

const siteUrl = new URL(SITE_URL)
const siteUrlForTicket = `${siteUrl.host}${siteUrl.pathname}`.replace(/\/$/, '')

export default function TicketInfoFooter({
  logoTextSecondaryColor = 'var(--accents-5)',
  golden = false,
}) {
  return (
    <div className=" flex gap-0" id="wayfinding--TicketInfo-footer">
      <div
        className={`${cn(styles.date, { [styles['date-golden']]: golden })} text-sm mr-4 ${
          golden && '!text-white'
        }`}
      >
        <div>{LW7_DATE}</div>
      </div>
      <div
        className={`${cn(styles.date, { [styles['date-golden']]: golden })} text-sm ${
          golden && '!text-white'
        }`}
      >
        {/* <div>supabase.com/launch-week</div> */}
      </div>
    </div>
  )
}
