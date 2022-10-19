/**
 * Component for showing user login.
 *
 * @component AppLogin
 */

import { Component, h, Prop, State } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { AppState } from '../../../store/app.store';
import { AuthService } from '../../../services/auth.service';
import { httpCode, appConfig } from '../../../config/config';
import { getFormValidations } from '../../../util/util';

@Component({
  tag: 'app-auth-login',
  styleUrl: '../shared/app-auth-shared.scss',
})
export class AppLogin {
  /**
   * AuthService instance.
   * @name authService
   * @type {Object}
   */
  private authService = AuthService;

  /**
   * history instance.
   */
  @Prop() history: RouterHistory;

  /**
   * Register form inputs and validations
   * @name formControls
   * @type {Object}
   */
  @State() formControls = getFormValidations('login');

  /**
   * Form submission state
   * @name submitted
   * @type {boolean}
   */
  @State() submitted = false;

  /**
   * Form loading state
   * @name formLoader
   * @type {boolean}
   */
  @State() formLoader = false;

  /**
   * Form error state
   * @name loginError
   * @type {string}
   */
  @State() loginError: string = '';

  /**
   * handle form values and do the validation work
   * @param   {string} controlName Control name for register form
   * @param   {any} value          Control value for register form
   *
   * @returns {void}
   */
  changeFormValue(controlName, value) {
    this.formControls = {
      ...this.formControls,
      [controlName]: {
        ...this.formControls[controlName],
        value: value,
        isValid: this.formControls[controlName].validate(value),
      },
    };
  }

  /**
   * Handle login form
   * Check user in supabase
   * Redirect user to dashboard
   * @param   {event} e Form submit event
   *
   * @returns {void}
   */
  async handleLogin(e) {
    e.preventDefault();
    this.submitted = true;
    let isFormValid = true;
    //Run all validation functions
    for (let controlName in this.formControls) {
      let control = this.formControls[controlName];
      control.validate(control.value);
      if (!control.isValid) {
        isFormValid = false;
      }
    }
    if (isFormValid) {
      this.formLoader = true;
      this.loginError = '';
      const loginRes = await this.authService.login({ email: this.formControls.email.value, password: this.formControls.password.value });
      if (loginRes.status == httpCode.success) {
        this.formLoader = false;
        this.history.push(`/`, {});
      } else {
        this.formLoader = false;
        this.loginError = loginRes.message;
      }
    }
  }

  /**
   * Render component <app-auth-login>
   *
   * @returns {void}
   */
  render() {
    if (AppState.isAuthenticated) {
      return <stencil-router-redirect url="/" />;
    }
    return (
      <section class="app-section">
        <stencil-route-title pageTitle={appConfig.pageTitle.login} />

        <div class="auth-box">
          <div class="auth-box-formbox">
            <div class="auth-box-headline">
              Don't have an account? <a href="/register">Register</a>
            </div>
            <div class="auth-box-login">
              <h1>
                Welcome to <span class="stencil">Stencil</span> & <span class="supabase">Supabase</span> starter App
              </h1>
              <p>Insert your auth data to navigate through the app</p>
              <form onSubmit={e => this.handleLogin(e)} novalidate>
                <div>
                  <label htmlFor="email"> E-Mail</label>
                  <input
                    type="email"
                    name="email"
                    class="input-email"
                    autocomplete="off"
                    value={this.formControls.email.value}
                    onInput={(ev: any) => this.changeFormValue('email', ev.target.value)}
                  />

                  {!this.formControls.email.isValid && this.submitted === true && <span class="text-danger">Please enter your email</span>}
                </div>
                <div>
                  <label htmlFor="password"> Password</label>
                  <input
                    type="password"
                    name="password"
                    class="input-password"
                    value={this.formControls.password.value}
                    onInput={(ev: any) => this.changeFormValue('password', ev.target.value)}
                  />

                  {!this.formControls.password.isValid && this.submitted === true && <span class="text-danger">Please enter your password</span>}
                </div>
                <div>
                  <button type="submit" class="btn" disabled={this.formLoader}>
                    {this.formLoader ? appConfig.loadingBtnTxt : 'Login to account'}
                  </button>
                </div>
              </form>

              {this.loginError && <app-flash-message>{this.loginError}</app-flash-message>}

              <div class="alternate-text">Or sign in with</div>
              <div class="alternate-boxes">
                <div class="alternate-box">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-brand-google"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M17.788 5.108a9 9 0 1 0 3.212 6.892h-8"></path>
                  </svg>
                </div>
                <div class="alternate-box">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-brand-facebook"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3"></path>
                  </svg>
                </div>
                <div class="alternate-box">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-brand-apple"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M9 7c-3 0 -4 3 -4 5.5c0 3 2 7.5 4 7.5c1.088 -.046 1.679 -.5 3 -.5c1.312 0 1.5 .5 3 .5s4 -3 4 -5c-.028 -.01 -2.472 -.403 -2.5 -3c-.019 -2.17 2.416 -2.954 2.5 -3c-1.023 -1.492 -2.951 -1.963 -3.5 -2c-1.433 -.111 -2.83 1 -3.5 1c-.68 0 -1.9 -1 -3 -1z"></path>
                    <path d="M12 4a2 2 0 0 0 2 -2a2 2 0 0 0 -2 2"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
