import { useRouter } from 'next/router'
import Layout from '~/components/layouts/DocsLayout'
import Sidebars from '~/content/docs/sidebars'

const importReducer = ctx => {
  let keys = ctx.keys();
  let values = keys.map(ctx);
  return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {});
}

let Docs = []
Docs['packaged'] = importReducer(require.context('../../../content/docs/packaged', true, /.mdx$/));
Docs['admin-api'] = importReducer(require.context('../../../content/docs/admin-api', true, /.mdx$/));


export default function ProductDocs() {
  const router = useRouter()
  let { product, slug } = router.query
  if (!product || !slug) return <div></div>

  let sidebar = Sidebars[product]

  const Doc = Docs[product][`./${slug}.mdx`]
  const { metadata } = Doc
  const { title, description } = metadata

  return (
    <Layout>
      <div className="content">
        <div className="has-background-dark p-md">
          <h1 className="title">{title}</h1>
          <p className="subtitle">{description}</p>
        </div>
        <div className="p-md">
          <Doc.default />
        </div>
      </div>
    </Layout>
  )
}
