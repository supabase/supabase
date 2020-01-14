import React, { useState } from 'react'
import classnames from 'classnames'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'
import CodeBlock from '@theme/CodeBlock'

const heroExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to your own PostgreSQL database
const supabase = createClient('https://your-db.supabase.co', '1a2b-3c4d-5e6f-7g8h')

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
    messages { text }
  \`)
`.trim()
const createExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to the chat room 
const supabase = createClient('https://chat-room.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Create a new chat room
const newRoom = supabase
  .from('rooms')
  .insert({ name: 'Supabase Fan Club', public: true })
`.trim()
const updateExample = `
import { createClient } from '@supabase/supabase-js'

// Connect to the chat room 
const supabase = createClient('https://chat-room.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Update a user
const updatedUser = supabase
  .from('users')
  .eq('username', 'kiwicopple')
  .update({ status: 'Online' })
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
    title: <>Event sourcing</>,
    imageUrl: '',
    description: <>Log all your database changes to an immutable logging system</>,
    href: '/docs/guides/examples',
  },
]

function Feature({ imageUrl, title, description, href }) {
  const imgUrl = useBaseUrl(imageUrl)
  return (
    <div className={classnames('col', styles.feature)}>
      <a className={classnames('card', styles.featureCard)} href={href}>
        <div className="card__body">
          {imgUrl && (
            <div className="">
              <img className={styles.featureImage} src={imgUrl} alt={title} />
            </div>
          )}
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </a>
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
              <div className="col">
                <h2 className="hero__title">{siteConfig.tagline}</h2>
                <p className="hero__subtitle">
                  Supabase adds realtime and RESTful APIs to your{' '}
                  <strong className="has-emphasis">existing</strong> PostgreSQL database without a
                  single line of code.
                </p>
                <div>
                  <Link
                    className={classnames(
                      'button hero--button button--md button--secondary button--outline',
                      styles.button
                    )}
                    to={useBaseUrl('docs/about')}
                    style={{ marginLeft: 0, marginTop: 10 }}
                  >
                    Learn More
                  </Link>
                  <Link
                    className={classnames(
                      'button hero--button button--md button--primary',
                      styles.button
                    )}
                    to={'https://app.supabase.io'}
                    style={{ marginTop: 10 }}
                  >
                    Join the List →
                  </Link>
                </div>
              </div>
              <div className="col code-with-header">
                <div className="code-header">Get notified of all new records in your database</div>
                <CodeBlock>{heroExample}</CodeBlock>
              </div>
            </div>
          </div>
        </header>

        <section
          style={{
            padding: '50px 0',
          }}
          className="hero is--dark"
        >
          <div className="container text--center">
            <small>CUSTOMER LOGOS</small>
          </div>
        </section>

        {/* For Devs */}
        <section className={styles.forDevelopers}>
          <div className="container">
            <div className={classnames('row', styles.responsiveCentered)}>
              <div className="col col--8 col--offset-2">
                <h2 className="with-underline">For Developers</h2>
                <p className="">
                  We know developers want fast, solid, and simple products. So that's what we make.
                  <br />
                  Forget about building repetitive CRUD APIs. We introspect your database and
                  provide APIs <strong className="has-emphasis">instantly</strong> so you can focus
                  on what's most important - building your products.
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
                    <>
                      <div className="code-header">Receive realtime messages in an example chat room</div>
                      <CodeBlock>{subscribeExample}</CodeBlock>
                    </>
                  )}
                  {visibleCodeExample === 'READ' && (
                    <>
                      <div className="code-header">Get all public rooms and their messages</div>
                      <CodeBlock>{readExample}</CodeBlock>
                    </>
                  )}
                  {visibleCodeExample === 'CREATE' && (
                    <>
                      <div className="code-header">Create a new chat room</div>
                      <CodeBlock>{createExample}</CodeBlock>
                    </>
                  )}
                  {visibleCodeExample === 'UPDATE' && (
                    <>
                      <div className="code-header">Update a user</div>
                      <CodeBlock>{updateExample}</CodeBlock>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <h2 className="with-underline">Use Cases</h2>
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section
          style={{
            marginTop: 100,
            padding: '50px 0',
            borderTop: '1px solid var(--custom-border-color)',
          }}
          className="hero is--dark"
        >
          <div className="container text--center">
            <div>
              <h2>Get Early Access</h2>
            </div>
            <div className="">
              <Link
                className={classnames(
                  'button hero--button button--outline button--md button--secondary',
                  styles.button,
                  styles.responsiveButton
                )}
                style={{ margin: 5 }}
                to={useBaseUrl('docs/about')}
              >
                Learn More
              </Link>
              <Link
                className={classnames(
                  'button hero--button button--md button--primary',
                  styles.button,
                  styles.responsiveButton
                )}
                to={'https://app.supabase.io'}
                style={{ margin: 5 }}
              >
                Join the list →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default Home
