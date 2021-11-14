import { ReactElement } from 'react'
import styles from '../../styles/Home.module.css'
import NavBar from '../nav/NavBar'
import SideBar from '../nav/SideBar'
import Footer from '../Footer'

const DocsLayout = ({ children }: { children: ReactElement }) => {
  return (
    <div className={`${styles.container} h-full`}>
      <main className={`${styles.main}`}>
        <NavBar />
        <div className="flex flex-row ">
          <SideBar />
          <div className={`${styles.content} p-8`}>{children}</div>
        </div>
        <Footer />
      </main>
    </div>
  )
}

export default DocsLayout
