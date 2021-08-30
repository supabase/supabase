/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import BlogPostItem from '@theme/BlogPostItem'
import BlogListPaginator from '@theme/BlogListPaginator'
import type { Props } from '@theme/BlogListPage'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'
import clsx from 'clsx'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function BlogListPage(props: Props): JSX.Element {
  const { metadata, items } = props
  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext()
  const isBlogOnlyMode = metadata.permalink === '/'
  const title = isBlogOnlyMode ? siteTitle : 'Blog'
  const { blogDescription } = metadata

  return (
    <Layout title={title} description={blogDescription}>
      <div className="BlogListPage container margin-vert--lg">
        <div className="row">
          <main className="col col--10 col--offset-1">
              {items.map(({ content: BlogPostContent }) => {
                const { date, permalink, tags, readingTime } = BlogPostContent.metadata
                const match = date.substring(0, 10).split('-')
                const year = match[0]
                const month = MONTHS[parseInt(match[1], 10) - 1]
                const day = parseInt(match[2], 10)
                return (
                  <div className="row">
                    <Link
                      className={clsx('', styles.PostPreview)}
                      to={BlogPostContent.metadata.permalink}
                      key={BlogPostContent.metadata.permalink}
                    >
                      <div className={clsx('card__body', styles.PostPreviewBody)}>
                        <div className={styles.PostPreviewHeading}>
                          <h3>{BlogPostContent.frontMatter.title}</h3>
                          <div className="avatar">
                            <img
                              className="avatar__photo avatar__photo--sm"
                              src={BlogPostContent.frontMatter.author_image_url}
                            />
                          </div>
                        </div>

                        <div className="row row--no-gutters">
                          <div className={styles.PreviewDate}>
                            <time dateTime={date} className={styles.blogPostDate}>
                              {month} {day}, {year}{' '}
                            </time>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            <div style={{ paddingLeft: 12 }}>
              <BlogListPaginator metadata={metadata} />
            </div>
          </main>
        </div>
      </div>
    </Layout>
  )
}

export default BlogListPage
