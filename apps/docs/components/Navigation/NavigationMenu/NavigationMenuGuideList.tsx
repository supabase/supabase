import { useRouter } from 'next/router'
import rehypeFilter from 'react-markdown/lib/rehype-filter'
import { IconChevronLeft } from '~/../../packages/ui'
import * as NavItems from './NavigationMenu.constants'

const NavigationMenuGuideList = ({ currentLevel, setLevel, tempBasePath, id }) => {
  const router = useRouter()

  const menu = NavItems[id]

  return (
    <div
      className={[
        'transition-all ml-8 duration-150 ease-out',

        // enabled
        currentLevel === id && 'opacity-100 ml-0 delay-150',
        currentLevel === 'home' && 'ml-12',

        // disabled
        currentLevel !== 'home' && currentLevel !== id ? '-ml-8' : '',
        currentLevel !== id ? 'opacity-0 invisible absolute' : '',
      ].join(' ')}
    >
      <ul className={'relative w-full flex flex-col gap-0'}>
        <li
          onClick={() => {
            router.push(`${tempBasePath}${menu.parent ?? ''}`)
            // setLevel(menu.parent && 'home')
          }}
          className={[
            'flex items-center gap-1 text-xs group mb-3',
            'text-base transition-all duration-200 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
          ].join(' ')}
        >
          <div className="relative w-2">
            <div>
              <IconChevronLeft size={10} />
            </div>
          </div>
          <span>back</span>
        </li>

        <div className="flex items-center gap-3 my-3">
          {/* <div className="w-10 h-10 bg-brand-500 rounded flex items-center justify-center"> */}
          <img
            src={`${router.basePath}` + menu.icon ?? `/img/icons/menu/${id}.svg`}
            className="w-5 rounded"
          />
          {/* </div> */}
          <h2 className={['text-scale-1200 ', !menu.title && 'capitalize'].join(' ')}>
            {menu.title ?? currentLevel}
          </h2>
        </div>

        {menu.items.map((x, index) => {
          return (
            <div>
              {x.items && x.items.length > 0 ? (
                <>
                  {index !== 0 && <div className="h-px w-full bg-green-500 my-3"></div>}
                  <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
                    {x.name}
                  </span>
                  {x.items.map((x) => {
                    return (
                      <li>
                        <a
                          onClick={() => {
                            router.push(`/${tempBasePath}${x.href}`)
                          }}
                          className="cursor-pointer transition text-scale-1000 text-sm hover:text-brand-900"
                        >
                          {x.name}
                        </a>
                      </li>
                    )
                  })}
                </>
              ) : (
                <li>
                  <a
                    onClick={() => {
                      router.push(`/${tempBasePath}${x.href}`)
                    }}
                    className="cursor-pointer transition text-scale-1000 text-sm hover:text-brand-900 flex gap-3"
                  >
                    {x.icon && <img className="w-3" src={`${router.basePath}${x.icon}`} />}
                    {x.name}
                  </a>
                </li>
              )}
            </div>
          )
        })}
        {menu.extras && <div className="h-px w-full bg-green-500 my-3"></div>}
        {menu.extras?.map((x) => {
          return (
            <div>
              <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
                {x.name}
              </span>
              {x.items.map((x) => {
                return (
                  <li className="transition text-scale-1000 text-sm hover:text-brand-900">
                    {x.name}
                  </li>
                )
              })}
            </div>
          )
        })}
      </ul>
    </div>
  )
}

export default NavigationMenuGuideList
