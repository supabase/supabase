import React, { useState } from 'react'
import classnames from 'classnames'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'
import CustomCodeBlock from '../components/CustomCodeBlock'
import GithubCard from '../components/GithubCard'
import HowCard from '../components/HowCard'
import { repos } from '../data/github'

const heroExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to your own PostgreSQL database
const supabase = createClient('https://your-db.supabase.co', 'api-key')

// Receive updates when a new record is inserted into your database
const realtime = supabase
  .from('*')
  .on('INSERT', change => {
    console.log('Change received!', change)
  })
  .subscribe()
`.trim()
const subscribeExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to the chat room 
const supabase = createClient('https://chat-room.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Get notified of all new chat messages
const realtime = supabase
  .from('messages')
  .on('INSERT', message => {
    console.log('New message!', message)
  })
  .subscribe()
`.trim()
const readExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to the chat room 
const supabase = createClient('https://chat-room.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Get public rooms and their messages
const publicRooms = await supabase
  .from('rooms')
  .eq('public', true)
  .select(\`
    name,
    messages ( text )
  \`)
`.trim()
const createExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to the chat room 
const supabase = createClient('https://chat-room.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Create a new chat room
const newRoom = await supabase
  .from('rooms')
  .insert({ name: 'Supabase Fan Club', public: true })
`.trim()
const updateExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to the chat room 
const supabase = createClient('https://chat-room.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Update multiple users
const updatedUsers = await supabase
  .from('users')
  .eq('account_type', 'paid')
  .update({ highlight_color: 'gold' })
`.trim()

const features = [
  {
    title: <>Chat apps</>,
    imageUrl: '',
    description: <>Build a realtime chat application using PostgreSQL and Expo</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Realtime dashboards</>,
    imageUrl: '',
    description: <>Build live dashboards using PostgreSQL and D3.js</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Logging</>,
    imageUrl: '',
    description: <>Log all your database changes to an immutable logging system</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Realtime Games</>,
    imageUrl: '',
    description: <>Keep all players in-sync with game actions and leader dashboards.</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Streaming analytics</>,
    imageUrl: '',
    description: <>Send actions and events to your data warehouses.</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Backoffice and Admin</>,
    imageUrl: '',
    description: <>Build admin dashboards without stressing about conflict resolution.</>,
    href: '/docs/guides/examples',
  },
]

function Feature({ imageUrl, title, description, href }) {
  const imgUrl = useBaseUrl(imageUrl)
  return (
    <div className={classnames('col col--4 m-b-md', styles.feature)}>
      <Link className={classnames('card', styles.featureCard)} to={href}>
        <div className="card__body">
          {imgUrl && (
            <div className="">
              <img className={styles.featureImage} src={imgUrl} alt={title} />
            </div>
          )}
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  )
}

function Home() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context
  const [visibleCodeExample, showCodeExample] = useState('SUBSCRIBE')
  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <main className="HomePage">
        {/* HEARDER */}
        <header className={classnames('hero', styles.heroBanner)}>
          <div className="container">
            <div className="row">
              <div className="col col--5">
                <h2 className="hero__title">{siteConfig.tagline}</h2>
                <p className="hero__subtitle">
                  Supabase adds realtime and RESTful APIs to your{' '}
                  <strong className="has-emphasis">existing</strong> PostgreSQL database without a
                  single line of code.
                </p>
                <div>
                  <Link
                    className={classnames(
                      'button hero--button button--md button--secondary button--outline responsive-button',
                      styles.button
                    )}
                    to={useBaseUrl('docs/about')}
                    style={{ marginLeft: 0, marginTop: 10 }}
                  >
                    Learn More
                  </Link>
                  <Link
                    className={classnames(
                      'button hero--button button--md button--primary responsive-button',
                      styles.button
                    )}
                    to={'https://github.com/supabase/supabase'}
                    style={{ marginTop: 10 }}
                  >
                    Follow our GitHub →
                  </Link>
                </div>
              </div>
              <div className="col col--7">
                <CustomCodeBlock
                  header="Get notified of all new records in your database"
                  js={heroExample}
                />
              </div>
            </div>
          </div>
        </header>

        {/* <section
          style={{
            padding: '50px 0',
          }}
          className="hero is--dark"
        >
          <div className="container text--center"><small>CUSTOMER LOGOS</small></div>
        </section> */}

        {/* HOW */}
        <section className={'section-lg'}>
          <div className="container">
            <div className={classnames('row', styles.responsiveCentered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="with-underline">How it works</h2>
                <p className="">
                  Supabase helps you build faster, so you can focus on your core products.
                </p>
              </div>
            </div>

            <div className="HowSections row is-multiline">
              <div className={'col col--4 '}>
                <div>
                  <img
                    className="diagram"
                    src="/img/how-replication.png"
                    alt="Database replication"
                  />
                </div>
                <div>
                  <HowCard
                    title="Connect your database to Supabase"
                    description={
                      <>
                        Supabase introspects your database and provides instant APIs.
                      </>
                    }
                    featureTitle="You get"
                    features={[
                      'APIs always in sync with your schema',
                      'Instant RESTful API',
                      'Realtime notifications via websockets',
                    ]}
                  />
                </div>
              </div>

              <div className={'col col--4 '}>
                <div>
                  <img className="diagram" src="/img/how-transformation.png" alt="Supabase" />
                </div>
                <div>
                  <HowCard
                    title="Supabase handles the magic"
                    description={<>Supabase handles the stuff you're usually too busy to build.</>}
                    featureTitle="You get"
                    features={[
                      'Custom URL for your APIs',
                      'Custom API docs for your schema',
                      'Built-in security & monitoring',
                    ]}
                  />
                </div>
              </div>

              <div className={'col col--4 '}>
                <div>
                  <img className="diagram" src="/img/how-client-libs.png" alt="Client libraries" />
                </div>
                <div>
                  <HowCard
                    title="Build realtime applications"
                    description={
                      <>
                        Supabase provides libraries and examples to get you started.
                      </>
                    }
                    featureTitle="Build"
                    features={[
                      'Auto-updating dashboards',
                      'IoT applications',
                      'Realtime chat apps',
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Devs */}
        <section className={styles.forDevelopers}>
          <div className="container">
            <div className={classnames('row', styles.responsiveCentered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="with-underline">For Developers</h2>
                <p className="">
                  We introspect your database and provide APIs 
                  <strong className="has-emphasis">instantly</strong> so you can stop building
                  repetitive CRUD APIs and focus on building your products.
                </p>
              </div>
            </div>
            <div className="ForDevelopers">
              <div className="row">
                <div className="ButtonTabs col col--3">
                  <div>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'SUBSCRIBE' ? 'info is-active' : 'info'
                      }`}
                      onClick={() => showCodeExample('SUBSCRIBE')}
                    >
                      Realtime subscriptions
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'READ' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('READ')}
                    >
                      Get your data
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'CREATE' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('CREATE')}
                    >
                      Create a record
                    </button>
                    <button
                      className={`button button--${
                        visibleCodeExample === 'UPDATE' ? 'info is-active' : 'info '
                      }`}
                      onClick={() => showCodeExample('UPDATE')}
                    >
                      Update mulitple rows
                    </button>
                  </div>
                </div>
                <div className="col col--9 code-with-header">
                  {visibleCodeExample === 'SUBSCRIBE' && (
                    <CustomCodeBlock
                      header="Receive realtime messages in an example chat room"
                      js={subscribeExample}
                    />
                  )}
                  {visibleCodeExample === 'READ' && (
                    <CustomCodeBlock
                      header="Get all public rooms and their messages"
                      js={readExample}
                    />
                  )}
                  {visibleCodeExample === 'CREATE' && (
                    <CustomCodeBlock header="Create a new chat room" js={createExample} />
                  )}
                  {visibleCodeExample === 'UPDATE' && (
                    <CustomCodeBlock header="Update a user" js={updateExample} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className={'section-lg'}>
          <div className="container">
            <h2 className="with-underline">Use Cases</h2>
            <div className="row is-multiline">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* OSS */}
        <section className={'section-lg'}>
          <div className="container">
            <div className={classnames('row', styles.responsiveCentered)}>
              <div className="col col--6 col--offset-3">
                <h2 className="with-underline">Open source</h2>
                <p className="">
                  Follow us on <a href="https://github.com/supabase">GitHub</a>.{' '}
                  <strong>Watch</strong> the releases of each repo to get notified when we are ready
                  for Beta launch.
                </p>
              </div>
            </div>

            <div className="row is-multiline">
              {repos.map((props, idx) => (
                <div className={'col col--6'}>
                  <GithubCard
                    key={idx}
                    title={props.name}
                    description={props.description}
                    href={props.html_url}
                    stars={props.stargazers_count}
                    handle={props.full_name}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 100,
            padding: '50px 0',
            borderTop: '1px solid var(--custom-border-color)',
          }}
          className="hero is--dark"
        >
          <div className="container text--center">
            {/* <div>
              <h2>Get Early Access</h2>
            </div> */}
            <div className="">
              <Link
                className={classnames(
                  'button hero--button button--outline button--md button--secondary responsive-button',
                  styles.button
                )}
                style={{ margin: 5 }}
                to={useBaseUrl('docs/about')}
              >
                Learn More
              </Link>
              <Link
                className={classnames(
                  'button hero--button button--md button--primary responsive-button',
                  styles.button
                )}
                to={'https://github.com/supabase/supabase'}
                style={{ margin: 5 }}
              >
                Follow our GitHub →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default Home
