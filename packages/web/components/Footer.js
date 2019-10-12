import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import SignUpForm from '~/components/SignUpForm'

export default function Footer() {
  return (
    <footer className="footer p-b-md">
      <div className="section container p-t-none">
        <div className="columns">
          <div className="column">
            <h3 className="title is-3 ">
              <img src="/supabase-logo.svg" alt="Supabase" width="180" />
            </h3>
            <SignUpForm />
          </div>
          <div className="column is-3">
      </div>
          <div className="column is-2">
            <p className="heading">Products</p>
            <p><a href="https://docs.supabase.io">Docs</a></p>
          </div>
          <div className="column is-2">
            <p className="heading">Company</p>
            <p><a href="https://github.com/supabase/monorepo" target="_blank">Github</a></p>
          </div>
        </div>
      </div>
      <hr />
      <div className="level container">
        <div className="level-left ">
          <div className="level-item ">
            <small className="has-text-weight-bold">© Supabase</small>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <a className="is-size-7 m-r-md">Terms of Use</a>·
            <a className="is-size-7 m-l-md">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
