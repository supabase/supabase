import Param from '~/components/Params'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, MDXRemoteGuides, newEditLink } from '~/features/docs/GuidesMdx.template'
import { getAuthConfigV1 } from '~/lib/mdx/getConfig'

const meta = {
  title: 'Auth Self-hosting Config',
  description: 'How to configure and deploy Supabase Auth.',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/self-hosting/auth/config',
  meta,
}))

const AuthConfigPage = async () => {
  const spec = getAuthConfigV1()
  const descriptionMdx = spec.info.description

  return (
    <GuideTemplate
      meta={meta}
      editLink={newEditLink(
        'supabase/supabase/blob/master/apps/docs/pages/guides/self-hosting/auth/config.tsx'
      )}
    >
      <MDXRemoteGuides source={descriptionMdx} />

      <div>
        {spec.info.tags.map((tag: ReturnType<typeof getAuthConfigV1>['info']['tags']) => {
          return (
            <>
              <h2 className="text-foreground">{tag.title}</h2>
              <p className="text-foreground-lighter">{tag.description}</p>
              <div className="not-prose">
                <h5 className="text-base text-foreground mb-3">Parameters</h5>
                <ul>
                  {spec.parameters
                    .filter((param: ReturnType<typeof getAuthConfigV1>['parameters']) =>
                      param.tags.includes(tag.id)
                    )
                    .map((param: ReturnType<typeof getAuthConfigV1>['parameters']) => {
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

export default AuthConfigPage
export { generateMetadata }
