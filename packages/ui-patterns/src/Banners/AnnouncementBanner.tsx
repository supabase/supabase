import { Announcement } from 'ui/src/layout/banners'
import LW15Banner from './LW15Banner'
import announcementJSON from './data.json'

export const announcement = announcementJSON

export const AnnouncementBanner = () => {
  return (
    <Announcement show={true} announcementKey="announcement_lw15_d2">
      <LW15Banner />
    </Announcement>
  )
}
