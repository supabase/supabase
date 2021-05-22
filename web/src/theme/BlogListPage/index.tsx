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
            <div className="row is-multiline ">
              {items.map(({ content: BlogPostContent }) => {
                const { date, permalink, tags, readingTime } = BlogPostContent.metadata
                const match = date.substring(0, 10).split('-')
                const year = match[0]
                const month = MONTHS[parseInt(match[1], 10) - 1]
                const day = parseInt(match[2], 10)
                return (
                  <div className="col col--6">
                    <Link
                      className={clsx('card', styles.PostPreview)}
                      to={BlogPostContent.metadata.permalink}
                      key={BlogPostContent.metadata.permalink}
                    >
                      <div className={clsx('card__body', styles.PostPreviewBody)}>
                        <div className={styles.PostPreviewHeading}>
                          <h2>{BlogPostContent.frontMatter.title}</h2>
                        </div>

                        <div className="row row--no-gutters">
                          <div className={styles.PreviewDate}>
                            <time dateTime={date} className={styles.blogPostDate}>
                              {month} {day}, {year}{' '}
                              {readingTime && <> · {Math.ceil(readingTime)} min read</>}
                            </time>
                          </div>
                          <div className={styles.PreviewArrow}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        {/* <BlogPostItem
                    key={BlogPostContent.metadata.permalink}
                    frontMatter={BlogPostContent.frontMatter}
                    metadata={BlogPostContent.metadata}
                    truncated={BlogPostContent.metadata.truncated}
                  >
                    <BlogPostContent />
                  </BlogPostItem> */}
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
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
