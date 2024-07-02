import Param from '~/components/Params'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, MDXRemoteGuides, newEditLink } from '~/features/docs/GuidesMdx.template'
import { getRealtimeConfigV0 } from '~/lib/mdx/getConfig'

const meta = {
  title: 'Realtime Self-hosting Config',
  description: 'How to configure and deploy Supabase Realtime.',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/self-hosting/realtime/config',
  meta,
}))

const RealtimeConfigPage = async () => {
  const spec = getRealtimeConfigV0()
  const descriptionMdx = spec.info.description

  return (
    <GuideTemplate
      meta={meta}
      editLink={newEditLink(
        'supabase/supabase/blob/master/apps/docs/pages/guides/self-hosting/realtime/config.tsx'
      )}
    >
      <MDXRemoteGuides source={descriptionMdx} />

      <div>
        {spec.info.tags.map((tag: ReturnType<typeof getRealtimeConfigV0>['info']['tags']) => {
          return (
            <>
              <h2 className="text-foreground">{tag.title}</h2>
              <p className="text-foreground-lighter">{tag.description}</p>
              <div className="not-prose">
                <h5 className="text-base text-foreground mb-3">Parameters</h5>
                <ul>
                  {spec.parameters
                    .filter((param: ReturnType<typeof getRealtimeConfigV0>['parameters']) =>
                      param.tags.includes(tag.id)
                    )
                    .map((param: ReturnType<typeof getRealtimeConfigV0>['parameters']) => {
                      return (
                        <Param
                          name={param.title}
                          type={param.type}
                          description={param.description}
                          required={param.required}
                        />
                      )
                    })}
                </ul>
              </div>
            </>
          )
        })}
      </div>
    </GuideTemplate>
  )
}

export default RealtimeConfigPage
export { generateMetadata }
