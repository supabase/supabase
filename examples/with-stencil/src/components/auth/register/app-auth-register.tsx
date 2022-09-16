/**
 * Component for showing user register.
 *
 * @component AppAuthRegister
 */

import { Component, State, h, Prop } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { AuthService } from '../../../services/auth.service';
import { AppState } from '../../../store/app.store';
import { httpCode, appConfig } from '../../../config/config';
import { getFormValidations } from '../../../util/util';

@Component({
  tag: 'app-auth-register',
  styleUrl: '../shared/app-auth-shared.scss',
})
export class AppAuthRegister {
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
   */
  @State() formControls = getFormValidations('register');

  /**
   * Form submission state
   */
  @State() submitted = false;

  /**
   * Form loading state
   */
  @State() formLoader = false;

  /**
   * Form error state
   */
  @State() registerError: string = '';

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
   * Handle register form
   * Save user in supabase and update username
   * Redirect user to dashboard
   * @param   {event} e Form submit event
   *
   * @returns {void}
   */
  async handleRegister(e) {
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
      this.registerError = '';
      const registerRes = await this.authService.register({ email: this.formControls.email.value, password: this.formControls.password.value });
      if (registerRes.status == httpCode.success) {
        await this.authService.updateProfile(this.formControls.email.value);
        this.history.push(`/`, {});
      } else {
        this.registerError = registerRes.message;
        this.formLoader = false;
      }
    }
  }

  /**
   * Render component <app-auth-register>
   *
   * @returns {void}
   */
  render() {
    if (AppState.isAuthenticated) {
      return <stencil-router-redirect url="/" />;
    }
    return (
      <section class="app-section">
        <stencil-route-title pageTitle={appConfig.pageTitle.register} />

        <div class="auth-box">
          <div class="auth-box-formbox">
            <div class="auth-box-headline">
              Do you have an account? <a href="/login">Login</a>
            </div>
            <div class="auth-box-register">
              <h1>
                Welcome to <span class="stencil">Stencil</span> & <span class="supabase">Supabase</span> starter App
              </h1>
              <p>Insert your profile data to be able to navigate through the app</p>
              <form onSubmit={e => this.handleRegister(e)} novalidate>
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
                    {this.formLoader ? appConfig.loadingBtnTxt : 'Register now'}
                  </button>
                </div>
              </form>

              {this.registerError && <app-flash-message>{this.registerError}</app-flash-message>}
            </div>
          </div>
        </div>
      </section>
    );
  }
}
