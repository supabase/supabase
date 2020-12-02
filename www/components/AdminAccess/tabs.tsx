import Button from 'components/Button'
import TabMarkup from 'data/AdminAccess.json'

type Props = {
  tabId: string
  setTabId: Function
}

function Tabs(props: Props) {
  const { tabId, setTabId } = props

  function handleTabChange(event: any) {
    //@ts-ignore
    event.preventDefault()
    const tabId: string = event.target.id
    return setTabId(tabId)
  }

  return (
    <div className="flex justify-between w-full sm:relative -mt-20 lg:mt-0">
      <div>
        <div className="">
          <nav className="-mb-px flex" aria-label="Tabs">
            <a
              href="#"
              id="tabTableEditor"
              className={
                'transition w-1/3 lg:w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm' +
                (tabId === 'tabTableEditor'
                  ? ' border-gray-500 dark:border-white text-gray-600 dark:text-white'
                  : ' border-b border-gray-200 dark:border-dark-400 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200')
              }
              onClick={(event: any) => handleTabChange(event)}
            >
              Table Editor
            </a>
            <a
              href="#"
              id="tabSqlEditor"
              className={
                'transition w-1/3 lg:w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm' +
                (tabId === 'tabSqlEditor'
                  ? ' border-gray-500 dark:border-white text-gray-600 dark:text-white'
                  : ' border-b border-gray-200 dark:border-dark-400 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200')
              }
              onClick={(event: any) => handleTabChange(event)}
            >
              SQL Editor
            </a>
            <a
              href="#"
              id="tabAuthRules"
              className={
                'transition w-1/3 lg:w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm' +
                (tabId === 'tabAuthRules'
                  ? ' border-gray-500 dark:border-white text-gray-600 dark:text-white'
                  : ' border-b border-gray-200 dark:border-dark-400 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200')
              }
              onClick={(event: any) => handleTabChange(event)}
              aria-current="page"
            >
              Auth Rules
            </a>
          </nav>
        </div>

        {/* Might want to extract this out into a component within this file too */}
        <div className="mt-6">
          <div>
            <div className="mt-5">
              <dd className="mt-8 w-10/12 text-2xl text-gray-800 dark:text-white">
                {/* @ts-ignore */}
                {TabMarkup[tabId].header}
              </dd>
              <dd className="mt-8 text-base text-gray-500 dark:text-dark-300">
                {/* @ts-ignore */}
                {TabMarkup[tabId].description}
              </dd>
            </div>

            {/* @ts-ignore */}
            <Button className="mt-8" text={TabMarkup[tabId].cta} url={TabMarkup[tabId].url} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tabs
