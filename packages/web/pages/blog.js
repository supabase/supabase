// index.js
import React from 'react'
import MainLayout from '../components/MainLayout'
import MDXDocument, { metadata } from './posts/post.mdx'
export default () => (
  <>
    <MainLayout>
      <div className="section container">
        <div className="content">
          <MDXDocument />
        </div>
      </div>
    </MainLayout>
  </>
)
