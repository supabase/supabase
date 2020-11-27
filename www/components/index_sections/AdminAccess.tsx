import React, { useState, ReactElement } from 'react'
import Tabs from '../tabs'
import SectionHeader from '../UI/SectionHeader'

const AdminAccess = () => {
  const [tabId, setTabId] = useState('tabTableEditor')

  return (
    <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
      <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
        <div className="relative mt-12 items-center mt-24">
          <div className="relative">
            <SectionHeader
              title={'Build your app,'}
              title_alt={' without leaving the dashboard'} 
              subtitle={'Admin Access'} 
            />
            <div className="grid grid-cols-2 gap-52 items-center">
              <Tabs
                tabId={tabId}
                setTabId={setTabId}
              />
              <div className="shadow-md">
                <div className="w-full rounded-t-md h-5 bg-dark-200 flex items-center justify-start px-2">
                  <div className="h-2 w-2 mr-2 rounded-full bg-dark-300"/>
                  <div className="h-2 w-2 mr-2 rounded-full bg-dark-300"/>
                  <div className="h-2 w-2 mr-2 rounded-full bg-dark-300"/>
                </div>
                <video className="rounded-b-md" src={`videos/${tabId}.mp4`} autoPlay loop muted>
                  Your browser does not support the video tag
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAccess
