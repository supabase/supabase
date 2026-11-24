import { Announcement } from './Announcement'
import announcementJSON from './data.json'
import LW15Banner from './LW15Banner'

export const announcement = announcementJSON

export const AnnouncementBanner = () => {
  return (
    <Announcement show={true} announcementKey="announcement_lw15_d2">
      <LW15Banner />
    </Announcement>
  )
}
