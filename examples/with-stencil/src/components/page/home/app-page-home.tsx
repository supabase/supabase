import { Component, h } from '@stencil/core';

@Component({
  tag: 'app-page-home',
  styleUrl: 'app-page-home.scss',
})
export class AppPageHome {
  render() {
    return (
      <section class="wrapper_404 home-box">
        <div>
          <h1>Page not found ~ 404</h1>
          <p>The page you are requested is not found.</p>
          <stencil-route-link url="/">
            <div class="buttons">Back to Home</div>
          </stencil-route-link>
        </div>
      </section>
    );
  }
}
