/**
 * Component for showing user dashboard after login.
 *
 * @component AppHome
 */

import { Component, h } from '@stencil/core';
import { AppState } from '../../store/app.store';
import { appConfig } from '../../config/config';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  /**
   * Render component <app-home>
   *
   * @returns {void}
   */
  render() {
    return (
      <section class="app-home">
        <stencil-route-title pageTitle={appConfig.pageTitle.dashboard} />

        <div class="home-box">
          <div class="home-box-subbox">
            <div class="home-box-container">
              <h1>
                Welcome to the <span class="stencil">Stencil</span> & <span class="supabase">Supabase</span> dashboard
              </h1>

              <div class="home-box-image">
                <img src="./assets/images/supabase.png" />
              </div>

              <h2>
                Hi <span class="user-name">{AppState.user ? AppState.user.email : null}</span>,
              </h2>

              <p>
                Welcome to the {appConfig.name} dashboard.
                <br />
                This app demonstrate <strong>Login</strong>, <strong>Register</strong>, <strong>Logout</strong> features using Supabase + Stencil + Stencil Store as state
                management tool.
              </p>
              <p>
                You can read more about the technologies used here:{' '}
                <a rel="external" href="https://github.com/ionic-team/stencil" target="_blank">
                  Stencil
                </a>
                {', '}
                <a rel="external" href="https://stenciljs.com/docs/stencil-store" target="_blank">
                  Stencil Store
                </a>
                {', and '}
                <a rel="external" href="https://supabase.io" target="_blank">
                  Supabase
                </a>
                .
              </p>
              <br />

              <p>
                Created by:{' '}
                <a href="https://github.com/ftonato" rel="author" target="_blank">
                  Ademílson F. Tonato
                </a>{' '}
                -{' '}
                <a href="https://twitter.com/ftonato" rel="author" target="_blank">
                  @ftonato
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
