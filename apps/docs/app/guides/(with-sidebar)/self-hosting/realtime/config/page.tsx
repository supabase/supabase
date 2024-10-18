import Param from '~/components/Params'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import specRealtimeV0 from '~/spec/realtime_v0_config.yaml' assert { type: 'yml' }

const meta = {
  title: 'Realtime Self-hosting Config',
  description: 'How to configure and deploy Supabase Realtime.',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/self-hosting/realtime/config',
  meta,
}))

const RealtimeConfigPage = async () => {
  const descriptionMdx = specRealtimeV0.info.description

  return (
    <GuideTemplate
      meta={meta}
      editLink={newEditLink(
        'supabase/supabase/blob/master/apps/docs/pages/guides/self-hosting/realtime/config.tsx'
      )}
    >
      <MDXRemoteBase source={descriptionMdx} />

      <div>
        {specRealtimeV0.info.tags.map((tag: ReturnType<typeof specRealtimeV0>['info']['tags']) => {
          return (
            <>
              <h2 className="text-foreground">{tag.title}</h2>
              <p className="text-foreground-lighter">{tag.description}</p>
              <div className="not-prose">
                <h5 className="text-base text-foreground mb-3">Parameters</h5>
                <ul>
                  {specRealtimeV0.parameters
                    .filter((param: ReturnType<typeof specRealtimeV0>['parameters']) =>
                      param.tags.includes(tag.id)
                    )
                    .map((param: ReturnType<typeof specRealtimeV0>['parameters']) => {
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
