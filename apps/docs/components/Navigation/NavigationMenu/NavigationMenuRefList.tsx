import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronLeft } from '~/../../packages/ui'
import * as NavItems from './NavigationMenu.constants'
// @ts-expect-error
import jsSpec from '~/../../spec/supabase_js_v2_temp_new_shape.yml' assert { type: 'yml' }

const NavigationMenuRefList = ({ currentLevel, setLevel, id }) => {
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
      <div className={'relative w-full flex flex-col gap-0 sticky top-8'}>
        <Link href={`${menu.parent ?? '/'}`} passHref>
          <a
            className={[
              'flex items-center gap-1 text-xs group mb-3',
              'text-base transition-all duration-200 text-brand-900 hover:text-brand-1200 hover:cursor-pointer ',
            ].join(' ')}
          >
            <div className="relative w-2">
              <div className="transition-all ease-out ml-0 group-hover:-ml-1">
                <IconChevronLeft size={10} strokeWidth={3} />
              </div>
            </div>
            <span>Main Menu</span>
          </a>
        </Link>

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
        <ul>
          {jsSpec.functions.map((x, index) => {
            return (
              <li key={x.name}>
                {x.items && x.items.length > 0 ? (
                  <>
                    {x.items.map((subItem, subItemIndex) => {
                      return (
                        <>
                          {subItemIndex === 0 && (
                            <>
                              <div className="h-px w-full bg-green-500 my-3"></div>
                              <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
                                {x.name}
                              </span>
                            </>
                          )}

                          <Link href={`/${subItem.url}`} passHref key={subItem.name}>
                            <a className="cursor-pointer transition text-scale-1000 text-sm hover:text-brand-900">
                              {subItem.name}
                            </a>
                          </Link>
                          {/* {subItemIndex === x.items.length - 1 && (
                          <div className="h-px w-full bg-green-500 my-3"></div>
                        )} */}
                        </>
                      )
                    })}
                  </>
                ) : (
                  <>
                    <Link href={`#${x.id}`} passHref>
                      <a className="cursor-pointer transition text-scale-1000 text-sm hover:text-brand-900 flex gap-3">
                        {x.icon && <img className="w-3" src={`${router.basePath}${x.icon}`} />}
                        {x.title}
                      </a>
                    </Link>
                  </>
                )}
              </li>
            )
          })}
        </ul>
        {menu.extras && (
          <>
            <div className="h-px w-full bg-green-500 my-3"></div>
            <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider mb-2">
              Resources
            </span>
          </>
        )}
        {menu.extras?.map((x) => {
          return (
            <div key={x.name}>
              <li>
                <Link href={`/${x.href}`} passHref>
                  <a className="cursor-pointer transition text-scale-1100 text-sm hover:text-brand-900 flex gap-3 my-1">
                    {x.icon && <img className="w-4" src={`${router.basePath}${x.icon}`} />}
                    {x.name}
                  </a>
                </Link>
              </li>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NavigationMenuRefList
