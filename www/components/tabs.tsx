import React, { useState, ReactElement } from 'react'

type Props = {
  children: ReactElement[]
  event: any
  target: HTMLInputElement
  tabMarkup: any
  tabId: string
}

function Tabs() {
  const [tabId, setTabId] = useState('tabTableEditor')

  function handleTabChange(event: Props) {
    //@ts-ignore
    event.preventDefault()
    const tabId: string = event.target.id
    return setTabId(tabId)
  }

  const tabMarkup: any = {
    tabTableEditor: (
      <div>
        <div className="mt-5">
          <dd className="mt-2 text-base text-gray-800">
            Manage your data with the familiarity of a spreadsheet
          </dd>
          <dd className="mt-2 text-base text-gray-500">
            You don’t have to be a database expert to start using Supabase — Our table editor makes
            Postgres easy to use even for non-techies.
          </dd>
        </div>
        <button
          type="button"
          className="mt-6 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          Explore table view
        </button>
      </div>
    ),
    tabSqlEditor: (
      <div>
        <div className="mt-5">
          <dd className="mt-2 text-base text-gray-800">
            In-built SQL editor for when you need greater control
          </dd>
          <dd className="mt-2 text-base text-gray-500">
            Write, save, and execute SQL queries directly on our dashboard, with templates to help
            you save time from common queries and even build applications.
          </dd>
        </div>
        <button
          type="button"
          className="mt-6 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          Explore SQL editor
        </button>
      </div>
    ),
    tabAuthRules: (
      <div>
        <div className="mt-5">
          <dd className="mt-2 text-base text-gray-800">
            User management as straight-forward as it can be
          </dd>
          <dd className="mt-2 text-base text-gray-500">
            Easily manage your users via our authentication, or integrate third party logins. Create
            policies with complex SQL rules which fit your unique business needs.
          </dd>
        </div>
        <button
          type="button"
          className="mt-6 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          Explore auth policies
        </button>
      </div>
    ),
  }

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <a
            href="#"
            id="tabTableEditor"
            className={"w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm" + (tabId === "tabTableEditor" ? " border-brand-500 text-brand-600" : " border-b border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")}
            onClick={(event: any) => handleTabChange(event)}
          >
            Table editor
          </a>
          <a
            href="#"
            id="tabSqlEditor"
            className={"w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm" + (tabId === "tabSqlEditor" ? " border-brand-500 text-brand-600" : " border-b border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")}
            onClick={(event: any) => handleTabChange(event)}
          >
            SQL editor
          </a>
          <a
            href="#"
            id="tabAuthRules"
            className={"w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm" + (tabId === "tabAuthRules" ? " border-brand-500 text-brand-600" : " border-b border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")}
            onClick={(event: any) => handleTabChange(event)}
            aria-current="page"
          >
            Auth rules
          </a>
        </nav>
      </div>
      <div className="mt-6">{tabMarkup[tabId]}</div>
    </div>
  )
}

export default Tabs
