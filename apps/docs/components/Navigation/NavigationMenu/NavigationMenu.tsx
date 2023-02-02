import { useRouter } from 'next/router'
import { memo, useEffect } from 'react'
import { menuState, useMenuLevelId } from '~/hooks/useMenuState'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'
// @ts-expect-error
import spec_js_v2 from '~/../../spec/supabase_js_v2.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_js_v1 from '~/../../spec/supabase_js_v1.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_dart_v1 from '~/../../spec/supabase_dart_v1.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_dart_v0 from '~/../../spec/supabase_dart_v0.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_csharp_v0 from '~/../../spec/supabase_csharp_v0.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_python_v2 from '~/../../spec/supabase_py_v2.yml' assert { type: 'yml' }

// import { gen_v3 } from '~/lib/refGenerator/helpers'
import apiCommonSections from '~/../../spec/common-api-sections.json'
import cliCommonSections from '~/../../spec/common-cli-sections.json'
import libCommonSections from '~/../../spec/common-client-libs-sections.json'
import authServerCommonSections from '~/../../spec/common-self-hosting-auth-sections.json'
import realtimeServerCommonSections from '~/../../spec/common-self-hosting-realtime-sections.json'
import storageServerCommonSections from '~/../../spec/common-self-hosting-storage-sections.json'
import { flattenSections } from '~/lib/helpers'
import NavigationMenuHome from './HomeMenu'

// Filter libCommonSections for just the relevant sections in the current library
export function generateAllowedClientLibKeys(sections, spec) {
  // Filter parent sections first

  const specIds = spec.functions.map((func) => {
    return func.id
  })

  const newShape = flattenSections(sections).filter((section) => {
    if (specIds.includes(section.id)) {
      return section
    }
  })

  const final = newShape.map((func) => {
    return func.id
  })

  return final
}

export type RefIdOptions =
  | 'reference_javascript_v1'
  | 'reference_javascript_v2'
  | 'reference_dart_v0'
  | 'reference_dart_v1'
  | 'reference_csharp_v0'
  | 'reference_python_v2'
  | 'reference_cli'
  | 'reference_api'
  | 'reference_self_hosting_auth'
  | 'reference_self_hosting_storage'
  | 'reference_self_hosting_realtime'

export type RefKeyOptions =
  | 'javascript'
  | 'dart'
  | 'csharp'
  | 'python'
  | 'cli'
  | 'api'
  | 'self-hosting-auth'
  | 'self-hosting-storage'
  | 'self-hosting-realtime'

const NavigationMenu = () => {
  const router = useRouter()

  function handleRouteChange(url: string) {
    switch (url) {
      case `/docs`:
        menuState.setMenuLevelId('home')
        break
      case url.includes(`/docs/guides/getting-started`) && url:
        menuState.setMenuLevelId('gettingstarted')
        break
      case url.includes(`/docs/guides/database`) && url:
        menuState.setMenuLevelId('database')
        break
      case url.includes(`/docs/guides/auth`) && url:
        menuState.setMenuLevelId('auth')
        break
      case url.includes(`/docs/guides/functions`) && url:
        menuState.setMenuLevelId('functions')
        break
      case url.includes(`/docs/guides/realtime`) && url:
        menuState.setMenuLevelId('realtime')
        break
      case url.includes(`/docs/guides/storage`) && url:
        menuState.setMenuLevelId('storage')
        break
      case url.includes(`/docs/guides/platform`) && url:
        menuState.setMenuLevelId('platform')
        break
      case url.includes(`/docs/guides/resources`) && url:
        menuState.setMenuLevelId('resources')
        break
      case url.includes(`/docs/guides/self-hosting`) && url:
        menuState.setMenuLevelId('self_hosting')
        break
      case url.includes(`/docs/guides/integrations`) && url:
        menuState.setMenuLevelId('integrations')
        break
      case url.includes(`/docs/guides/cli`) && url:
        menuState.setMenuLevelId('supabase_cli')
        break
      // JS v1
      case url.includes(`/docs/reference/javascript/v1`) && url:
        menuState.setMenuLevelId('reference_javascript_v1')
        break
      // JS v2 (latest)
      case url.includes(`/docs/reference/javascript`) && url:
        menuState.setMenuLevelId('reference_javascript_v2')
        break
      // dart v0
      case url.includes(`/docs/reference/dart/v0`) && url:
        menuState.setMenuLevelId('reference_dart_v0')
        break
      // dart v1 (latest)
      case url.includes(`/docs/reference/dart`) && url:
        menuState.setMenuLevelId('reference_dart_v1')
        break
      // C# v0 (latest)
      case url.includes(`/docs/reference/csharp`) && url:
        menuState.setMenuLevelId('reference_csharp_v0')
        break
      // puthon v2 (latest)
      case url.includes(`/docs/reference/python`) && url:
        menuState.setMenuLevelId('reference_python_v2')
        break
      case url.includes(`/docs/reference/cli/config`) && url:
        menuState.setMenuLevelId('supabase_cli')
        break
      case url.includes(`/docs/reference/cli`) && url:
        menuState.setMenuLevelId('reference_cli')
        break
      case url.includes(`/docs/reference/api`) && url:
        menuState.setMenuLevelId('reference_api')
        break
      case url.includes(`/docs/reference/self-hosting-auth`) && url:
        menuState.setMenuLevelId('reference_self_hosting_auth')
        break
      case url.includes(`/docs/reference/self-hosting-storage`) && url:
        menuState.setMenuLevelId('reference_self_hosting_storage')
        break
      case url.includes(`/docs/reference/self-hosting-realtime`) && url:
        menuState.setMenuLevelId('reference_self_hosting_realtime')
        break

      default:
        break
    }
  }

  useEffect(() => {
    handleRouteChange(router.basePath + router.asPath)
    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  const level = useMenuLevelId()

  const isHomeActive = 'home' === level
  const isGettingStartedActive = 'gettingstarted' === level
  const isDatabaseActive = 'database' === level
  const isAuthActive = 'auth' === level
  const isFunctionsActive = 'functions' === level
  const isRealtimeActive = 'realtime' === level
  const isStorageActive = 'storage' === level
  const issupabase_cliActive = 'supabase_cli' === level
  const isPlatformActive = 'platform' === level
  const isResourcesActive = 'resources' === level
  const isSelfHosting = 'self_hosting' === level
  const isIntegrationsActive = 'integrations' === level
  const isReferenceActive = 'reference' === level

  const isReference_Javascript_V1 = 'reference_javascript_v1' === level
  const isReference_Javascript_V2 = 'reference_javascript_v2' === level
  const isReference_Dart_V0 = 'reference_dart_v0' === level
  const isReference_Dart_V1 = 'reference_dart_v1' === level
  const isReference_Csharp_V0 = 'reference_csharp_v0' === level
  const isReference_Python_V2 = 'reference_python_v2' === level
  const isReference_Cli = 'reference_cli' === level
  const isReference_Api = 'reference_api' === level
  const isReference_Self_Hosting_Auth = 'reference_self_hosting_auth' === level
  const isReference_Self_Hosting_Storage = 'reference_self_hosting_storage' === level
  const isReference_Self_Hosting_Realtime = 'reference_self_hosting_realtime' === level

  return (
    <div className={['flex relative', 'justify-center lg:justify-start'].join(' ')}>
      {/* // main menu */}
      <NavigationMenuHome active={isHomeActive} />
      <NavigationMenuGuideList id={'gettingstarted'} active={isGettingStartedActive} />
      <NavigationMenuGuideList id={'database'} active={isDatabaseActive} />
      <NavigationMenuGuideList id={'auth'} active={isAuthActive} />
      <NavigationMenuGuideList id={'functions'} active={isFunctionsActive} />
      <NavigationMenuGuideList id={'realtime'} active={isRealtimeActive} />
      <NavigationMenuGuideList id={'storage'} active={isStorageActive} />
      <NavigationMenuGuideList id={'supabase_cli'} active={issupabase_cliActive} />
      <NavigationMenuGuideList id={'platform'} active={isPlatformActive} />
      <NavigationMenuGuideList id={'resources'} active={isResourcesActive} />
      <NavigationMenuGuideList id={'self_hosting'} active={isSelfHosting} />
      <NavigationMenuGuideList id={'integrations'} active={isIntegrationsActive} />
      <NavigationMenuGuideList id={'reference'} active={isReferenceActive} />
      {/* // Client Libs */}
      <NavigationMenuRefList
        key={'reference-js-menu-v1'}
        id={'reference_javascript_v1'}
        active={isReference_Javascript_V1}
        commonSections={libCommonSections}
        lib="javascript"
        spec={spec_js_v1}
      />
      <NavigationMenuRefList
        key={'reference-js-menu'}
        id={'reference_javascript_v2'}
        active={isReference_Javascript_V2}
        commonSections={libCommonSections}
        lib="javascript"
        spec={spec_js_v2}
      />
      <NavigationMenuRefList
        key={'reference-dart-menu'}
        id={'reference_dart_v0'}
        active={isReference_Dart_V0}
        commonSections={libCommonSections}
        lib="dart"
        spec={spec_dart_v0}
      />
      <NavigationMenuRefList
        key={'reference-dart-menu-v1'}
        id={'reference_dart_v1'}
        active={isReference_Dart_V1}
        commonSections={libCommonSections}
        lib="dart"
        spec={spec_dart_v1}
      />
      <NavigationMenuRefList
        key={'reference-csharp-menu-v0'}
        id={'reference_csharp_v0'}
        active={isReference_Csharp_V0}
        commonSections={libCommonSections}
        lib="csharp"
        spec={spec_csharp_v0}
      />

      <NavigationMenuRefList
        key={'reference-python-menu-v2'}
        id={'reference_python_v2'}
        active={isReference_Python_V2}
        commonSections={libCommonSections}
        lib="python"
        spec={spec_python_v2}
      />
      {/* // Tools */}
      <NavigationMenuRefList
        key={'reference-cli-menu'}
        id={'reference_cli'}
        active={isReference_Cli}
        commonSections={cliCommonSections}
        lib="cli"
      />
      <NavigationMenuRefList
        key={'reference-api-menu'}
        id={'reference_api'}
        active={isReference_Api}
        commonSections={apiCommonSections}
        lib="api"
      />
      {/* // Self Hosting Server */}
      <NavigationMenuRefList
        key={'reference-self-hosting-auth-menu'}
        id={'reference_self_hosting_auth'}
        active={isReference_Self_Hosting_Auth}
        commonSections={authServerCommonSections}
        lib="self-hosting-auth"
      />
      <NavigationMenuRefList
        key={'reference-self-hosting-storage-menu'}
        id={'reference_self_hosting_storage'}
        active={isReference_Self_Hosting_Storage}
        commonSections={storageServerCommonSections}
        lib="self-hosting-storage"
      />
      <NavigationMenuRefList
        key={'reference-self-hosting-realtime-menu'}
        id={'reference_self_hosting_realtime'}
        active={isReference_Self_Hosting_Realtime}
        commonSections={realtimeServerCommonSections}
        lib="self-hosting-auth"
      />
    </div>
  )
}

export default memo(NavigationMenu)
