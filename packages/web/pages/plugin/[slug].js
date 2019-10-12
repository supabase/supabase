import { useRouter } from 'next/router'
import Layout from '../../components/MainLayout'
import Link from 'next/link'
import { inject, observer } from 'mobx-react'

@inject('store')
@observer
export default class Site extends React.Component {
  static async getInitialProps({ query }) {
    return {
      slug: query.slug,
    }
  }
  constructor(props) {
    super(props)
    this.state = {
      ...this.props,
    }
  }

  render() {
    let { slug } = this.state
    const Site = this.props.store.siteBySlug(slug)

    return (
      <Layout>
        <div className="hero is-light is-large">
          <div className="hero-body">Cover image</div>
        </div>
        <div className="container">
          <div className="section">
            <div className="columns">
              <div className="column is-8">
                <div className="content">
                  <h1 className="title is-1">{Site.name}</h1>
                  <Link href="/sites">
                    <a className="subtitle">{Site.location.name}</a>
                  </Link>
                  <span className="heading">Depth:</span>
                  <p>
                    {Site.min_depth}m - {Site.max_depth}m{' '}
                  </p>
                  <hr />
                  <p>{Site.blurb}</p>
                </div>

                <hr />
                <div className="level">
                  <div className="level-left">
                    <div className="level-item has-flex-start">
                      <h4 className="title is-4">
                        34 Dives <Rating />
                      </h4>
                    </div>
                  </div>
                  <div className="level-right">
                    <div className="level-item">
                      <input
                        className="input is-fullwidth"
                        type="text"
                        placeholder="Search dives"
                      />
                    </div>
                  </div>
                </div>

                <hr />

                <div className="columns is-multiline">
                  <div className="column is-half">
                    <div className="half-and-half">
                      <div>Visibility</div>
                      <div>
                        <Rating />
                      </div>
                    </div>
                  </div>
                  <div className="column is-half">
                    <div className="half-and-half">
                      <div>Sealife</div>
                      <div>
                        <Rating />
                      </div>
                    </div>
                  </div>
                  <div className="column is-half">
                    <div className="half-and-half">
                      <div>Enjoyment</div>
                      <div>
                        <Rating />
                      </div>
                    </div>
                  </div>
                  <div className="column is-half">
                    <div className="half-and-half">
                      <div>Novelty</div>
                      <div>
                        <Rating />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="image is-64x64">
                    <img src="https://bulma.io/images/placeholders/128x128.png" />
                  </p>
                  <strong>Barbara Middleton</strong>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis porta eros lacus,
                    nec ultricies elit blandit non. Suspendisse pellentesque mauris sit amet dolor
                    blandit rutrum. Nunc in tempus turpis.
                  </p>
                  <small>
                    <a>Like</a> · 3 hrs
                  </small>
                </div>
              </div>

              <div className="column">
                <div className="box">
                  <button className="button is-fullwidth m-b-sm">
                    <span className="icon">
                      <i className="far fa-heart" />
                    </span>
                    <span>Save</span>
                  </button>
                  <button className="button is-fullwidth m-b-sm">
                    <span className="icon">
                      <i className="far fa-share-square" />
                    </span>
                    <span>Share</span>
                  </button>
                  <button className="button is-primary is-fullwidth">Log a dive</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }
}

@inject('store')
@observer
class Rating extends React.Component {
  render() {
    return (
      <span className="Rating">
        <span className="icon has-text-primary">
          <i className="fas fa-star" />
        </span>
        <span className="icon has-text-primary">
          <i className="fas fa-star" />
        </span>
        <span className="icon has-text-primary">
          <i className="fas fa-star" />
        </span>
        <span className="icon has-text-primary">
          <i className="fas fa-star" />
        </span>
        <span className="icon has-text-primary">
          <i className="fas fa-star" />
        </span>
      </span>
    )
  }
}
