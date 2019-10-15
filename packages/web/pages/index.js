import MainLayout from '~/components/layouts/MainLayout'
import Link from 'next/link'
import SignUpForm from '~/components/SignUpForm'


export default class Home extends React.Component {
  render() {
    return (
      <MainLayout>
        <div className="section container">
          <div className="columns">
            <div className="column" style={{ maxWidth: 450 }}>
              <h1 className="title is-1">Supabase</h1>
              <p className="subtitle">Supercharge PostgreSQL.</p>
              <SignUpForm />
            </div>
          </div>
        </div>

        <div className="section container m-b-lg">
          <a name="pricing" id="pricing" />
          <h3 className="title is-3 has-underline ">Products</h3>
          <p className="subtitle">
            Extend your existing Postgres Database with opensource products.
          </p>
          <div className="columns is-multiline">
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Realtime</h4>
                <p>Listen to your database updates, inserts, and deletes over websockets.</p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Restful</h4>
                <p>
                  Add a fully documented Restful API, simply by introspecting the schema.
                </p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">GraphQL</h4>
                <p>Add a fully documented GraphQL API, without a line of code.</p>
              </a>
            </div>
          </div>
        </div>

        <div className="section container m-b-lg">
          <a name="pricing" id="pricing" />
          <h3 className="title is-3 has-underline ">Launch</h3>
          <p className="subtitle">
            Whether you're a DB expert or just a beginner, Supabase makes it ridiculously easy to get started with PostgreSQL.
          </p>
          <div className="columns is-multiline">
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Packaged PostgreSQL</h4>
                <p>
                  We've packaged PostgreSQL with a bunch of plugins and goodies that we think you'll
                  like.
                </p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Admin API</h4>
                <p>Manage your PostgreSQL database with a well documented Restful API.</p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Baseless</h4>
                <p>
                  We're building a serverless PostgreSQL so you can get started in seconds. Export
                  your database to a fully native PostgreSQL instance at any time.
                </p>
              </a>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }
}
