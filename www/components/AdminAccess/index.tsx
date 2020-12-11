import React, { useState } from 'react'
import Tabs from 'components/AdminAccess/tabs'
import SectionHeader from 'components/UI/SectionHeader'
import { useRouter } from 'next/router'

const AdminAccess = () => {
  const { basePath } = useRouter()
  const [tabId, setTabId] = useState('tabTableEditor')

  return (
    <div className="py-16 bg-gray-50 dark:bg-dark-700 overflow-hidden lg:py-24">
      <div className="container mx-auto px-8 sm:px-16 xl:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative items-center">
            <div className="relative">
              <SectionHeader
                title={'Build your app'}
                title_alt={' without leaving the dashboard'}
                subtitle={'Admin Access'}
              />
              <div className="flex flex-col-reverse lg:flex-row lg:grid lg:grid-cols-2 gap-28">
                <Tabs tabId={tabId} setTabId={setTabId} />
                <div className="shadow-lg rounded-md" style={{ height: 'fit-content' }}>
                  <div className="w-full rounded-t-md h-5 bg-dark-400 flex items-center justify-start px-2">
                    <div className="h-2 w-2 mr-2 rounded-full bg-dark-500" />
                    <div className="h-2 w-2 mr-2 rounded-full bg-dark-500" />
                    <div className="h-2 w-2 mr-2 rounded-full bg-dark-500" />
                  </div>
                  {/* Joshen: Preload all videos to prevent the flickering of video when changing tabs */}
                  <video
                    className={`rounded-b-md ${tabId === 'tabTableEditor' ? 'block' : 'hidden'}`}
                    src={`${basePath}/videos/tabTableEditor.mp4`}
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    Your browser does not support the video tag
                  </video>
                  <video
                    className={`rounded-b-md ${tabId === 'tabSqlEditor' ? 'block' : 'hidden'}`}
                    src={`${basePath}/videos/tabSqlEditor.mp4`}
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    Your browser does not support the video tag
                  </video>
                  <video
                    className={`rounded-b-md ${tabId === 'tabAuthRules' ? 'block' : 'hidden'}`}
                    src={`${basePath}/videos/tabAuthRules.mp4`}
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    Your browser does not support the video tag
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAccess
