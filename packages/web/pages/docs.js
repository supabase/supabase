// index.js
import React from 'react'
import Layout from '~/components/layouts/MainLayout'
import NavbarDocs from '~/components//NavbarDocs'

export default () => (
    <Layout>
        <div className="section container">
    <NavbarDocs />
          <div className="content">
            <h1>Docs</h1>
            
          </div>
        </div>
    </Layout>
)
