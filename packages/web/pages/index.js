import MainLayout from '~/components/MainLayout'
import Link from 'next/link'

import { inject, observer } from 'mobx-react'

@inject('store')
@observer
export default class Home extends React.Component {
  render() {
    return (
      <MainLayout>
        <div className="hero">
          <div className="hero-body">
            <div className="columns">
              <div className="column has-text-centered">
                <h1 className="title is-1">Supabase</h1>
                <p className="subtitle">Supercharge Postgres without a single line of code.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section container m-b-lg">
          <a name="pricing" id="pricing" />
          <h3 className="title is-3 has-underline ">Apps</h3>
          <div className="columns is-multiline">
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Realtime</h4>
                <p>Subscribe to all changes to your database over websockets.</p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Restful API</h4>
                <p>Add a fully documented Restful API, without a line of code.</p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">GraphQL</h4>
                <p>Add a fully documented GraphQL API, without a line of code.</p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Admin API</h4>
                <p>Manage your database with a Restful API rather than SQL.</p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Forms</h4>
                <p>Embeddable and customizable forms, fully validated and secure. <span className="tag is-small">COMING SOON</span></p>
              </a>
            </div>
            <div className="column is-4">
              <a className="box deep-hover" style={{ height: '100%' }}>
                <h4 className="title is-4">Dashboard</h4>
                <p>Manage your database with a Restful API rather than SQL. <span className="tag is-small">COMING SOON</span></p>
              
              </a>
            </div>
          </div>
        </div>

        <div className="section container m-b-lg">
          <a name="pricing" id="pricing" />
          <h3 className="title is-3 has-underline ">Pricing</h3>
          <div className="columns has-text-centered">
            <div className="column">
              <Link href="/docs?page=hosting">
                <a className="box">
                  <div className="title is-3">Free</div>
                  <ul>
                    <li>Feature</li>
                    <li>Feature</li>
                  </ul>
                </a>
              </Link>
            </div>
            <div className="column">
              <a className="box">
                <div className="title is-3">Free</div>
                <ul>
                  <li>Feature</li>
                  <li>Feature</li>
                </ul>
              </a>
            </div>
            <div className="column">
              <a className="box">
                <div className="title is-3">Free</div>
                <ul>
                  <li>Feature</li>
                  <li>Feature</li>
                </ul>
              </a>
            </div>
          </div>
        </div>

        <div className="section container">
          <h3 className="title is-3 has-underline">Section title</h3>
          <div className="content">
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <p>
              This is what a paragraph looks like with <a href="#">a linky link.</a>
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }
}
